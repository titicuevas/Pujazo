/**
 * OCR local con Tesseract (navegador).
 * Preprocesa capturas oscuras de fantasy (contraste + inversión + escala)
 * y prueba varios modos de página para maximizar nombres/valores leídos.
 */

import { parsePastedPlayers } from "@/lib/importPaste";

export type OcrProgress = {
  status: string;
  progress: number;
};

export type OcrResult = {
  text: string;
  confidence: number;
};

let workerPromise: Promise<import("tesseract.js").Worker> | null = null;
let latestProgress: ((info: OcrProgress) => void) | undefined;

async function getWorker(): Promise<import("tesseract.js").Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      // spa+eng: nombres internacionales (Kang-in, Lookman…) y UI en español
      const worker = await createWorker(["spa", "eng"], 1, {
        logger: (message) => {
          if (!latestProgress) return;
          if (typeof message.progress === "number") {
            latestProgress({
              status: String(message.status ?? "ocr"),
              progress: message.progress,
            });
          }
        },
      });
      await worker.setParameters({
        preserve_interword_spaces: "1",
      });
      return worker;
    })();
  }
  return workerPromise;
}

/** Libera el worker (opcional; se reutiliza entre capturas de la sesión). */
export async function terminateOcrWorker(): Promise<void> {
  if (!workerPromise) return;
  try {
    const worker = await workerPromise;
    await worker.terminate();
  } finally {
    workerPromise = null;
  }
}

/**
 * Prepara la captura para OCR: escala, contraste e inversión
 * (Biwenger/Comunio suelen ser texto claro sobre fondo oscuro).
 */
export async function preprocessFantasyScreenshot(
  image: Blob,
): Promise<Blob> {
  if (typeof createImageBitmap === "undefined" || typeof document === "undefined") {
    return image;
  }

  const bitmap = await createImageBitmap(image);
  try {
    const maxSide = 1600;
    const scale = Math.min(
      2.2,
      Math.max(1, maxSide / Math.max(bitmap.width, bitmap.height)),
    );
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return image;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);

    const frame = ctx.getImageData(0, 0, width, height);
    const data = frame.data;

    // Luminancia media: decide si invertir (UI oscura → texto blanco)
    let sum = 0;
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      sum += 0.299 * r + 0.587 * g + 0.114 * b;
    }
    const avg = sum / (data.length / 16);
    const invert = avg < 110;

    for (let i = 0; i < data.length; i += 4) {
      let y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // contraste
      y = (y - 128) * 1.55 + 128;
      if (invert) y = 255 - y;
      // umbral suave (texto más nítido)
      if (y > 185) y = 255;
      else if (y < 70) y = 0;
      const v = Math.max(0, Math.min(255, y));
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    }

    ctx.putImageData(frame, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png", 1),
    );
    return blob ?? image;
  } finally {
    bitmap.close();
  }
}

function scoreOcrText(text: string): number {
  const parsed = parsePastedPlayers(text);
  const moneyHits = (text.match(/\d{1,3}(?:\.\d{3})+\s*€|\d+[.,]\d+\s*[mM]\b/g) ?? [])
    .length;
  const nameHits = parsed.players.length;
  const hasVender = /\b(Vender|Pujar|En venta)\b/i.test(text) ? 3 : 0;
  const hasShare = /#\s*Biwenger/i.test(text) ? 8 : 0;
  return nameHits * 4 + moneyHits * 2 + hasVender + hasShare + Math.min(text.length / 80, 8);
}

async function recognizeOnce(
  worker: import("tesseract.js").Worker,
  image: Blob,
  psm: number,
): Promise<OcrResult> {
  await worker.setParameters({
    tessedit_pageseg_mode: String(psm) as never,
  });
  const result = await worker.recognize(image);
  return {
    text: (result.data.text ?? "").replace(/\r\n/g, "\n").trim(),
    confidence: Number(result.data.confidence ?? 0),
  };
}

/**
 * Extrae texto de una captura/foto (File o Blob).
 * Orientado a pantallas de fantasy (nombres + valores).
 */
export async function recognizeImageText(
  image: File | Blob,
  onProgress?: (info: OcrProgress) => void,
): Promise<OcrResult> {
  if (typeof window === "undefined") {
    throw new Error("El OCR solo funciona en el navegador.");
  }

  const maxBytes = 12 * 1024 * 1024;
  if (image.size > maxBytes) {
    throw new Error(
      "La imagen es demasiado pesada (máx. 12 MB). Prueba una captura más ligera.",
    );
  }
  if (image.type && !image.type.startsWith("image/")) {
    throw new Error("El archivo no parece una imagen.");
  }

    onProgress?.({ status: "warmup", progress: 0 });
    latestProgress = onProgress;
    try {
      onProgress?.({ status: "tactics", progress: 0.05 });
      const prepared = await preprocessFantasyScreenshot(image);
      const worker = await getWorker();

      // PSM 6 = bloque uniforme; 4 = columna; 11 = texto disperso (rejillas)
      const modes = [6, 4, 11];
      let best: OcrResult = { text: "", confidence: 0 };
      let bestScore = -1;

      for (let i = 0; i < modes.length; i++) {
        const mode = modes[i];
        onProgress?.({
          status: `scouting:${i + 1}/${modes.length}`,
          progress: 0.15 + (i / modes.length) * 0.7,
        });
        const attempt = await recognizeOnce(worker, prepared, mode);
        const score = scoreOcrText(attempt.text);
        if (score > bestScore) {
          best = attempt;
          bestScore = score;
        }
        // Si ya detecta varios jugadores con dinero, basta
        if (parsePastedPlayers(attempt.text).players.length >= 6) {
          best = attempt;
          break;
        }
      }

      // Fallback: imagen original por si el preprocesado empeora algún caso
      if (parsePastedPlayers(best.text).players.length < 2) {
        onProgress?.({ status: "second-half", progress: 0.9 });
        const rawAttempt = await recognizeOnce(worker, image, 6);
        if (scoreOcrText(rawAttempt.text) > bestScore) {
          best = rawAttempt;
        }
      }

    return best;
  } finally {
    latestProgress = undefined;
  }
}
