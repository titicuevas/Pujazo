/**
 * OCR local con Tesseract (navegador).
 * La imagen no se sube a nuestro servidor; el worker descarga modelos de idioma
 * la primera vez (CDN de tesseract.js) y procesa en el dispositivo.
 */

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
      const worker = await createWorker("spa", 1, {
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

  const maxBytes = 8 * 1024 * 1024;
  if (image.size > maxBytes) {
    throw new Error(
      "La imagen es demasiado pesada (máx. 8 MB). Prueba una captura más ligera.",
    );
  }
  if (!image.type.startsWith("image/")) {
    throw new Error("El archivo no parece una imagen.");
  }

  onProgress?.({ status: "preparando", progress: 0 });
  latestProgress = onProgress;
  try {
    const worker = await getWorker();
    const result = await worker.recognize(image);
    const text = (result.data.text ?? "").replace(/\r\n/g, "\n").trim();
    const confidence = Number(result.data.confidence ?? 0);
    return { text, confidence };
  } finally {
    latestProgress = undefined;
  }
}
