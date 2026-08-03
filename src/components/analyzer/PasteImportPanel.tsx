"use client";

import { useId, useRef, useState } from "react";
import { Button, TextArea } from "@/components/ui/Primitives";
import {
  getPasteFailureHint,
  parsePastedPlayers,
  type ParsedPastePlayer,
  type PasteMeta,
} from "@/lib/importPaste";
import { recognizeImageText } from "@/lib/ocrPaste";
import type { PlatformId } from "@/lib/types";

type PasteMode = "replace" | "append";
type ImportKind = "squad" | "market";

const GUIDE: Record<
  PlatformId,
  Record<ImportKind, { where: string; tip: string }>
> = {
  biwenger: {
    squad: {
      where:
        "En Biwenger app: Equipo → Plantilla. Puedes compartir la plantilla o hacer captura de la lista.",
      tip: "Si compartes y solo salen nombres, completa valores a mano. La captura de la lista con “Vender” trae precios.",
    },
    market: {
      where:
        "En Biwenger app: Mercado → Compartir (sale un texto con #Biwenger y los nombres). Pégalo aquí.",
      tip: "Ese share no trae precios: luego rellena valores o usa captura de la rejilla del mercado.",
    },
  },
  comunio: {
    squad: {
      where:
        "En Comunio: abre tu equipo / plantilla (lista de jugadores con valor).",
      tip: "Si no puedes copiar, captura la pantalla e impórtala aquí.",
    },
    market: {
      where:
        "En Comunio: mercado u ofertas con nombres, posición y valor.",
      tip: "Revisa después las pujas: el OCR o el pegado pueden fallar en precios.",
    },
  },
  laliga_fantasy: {
    squad: {
      where:
        "En LALIGA FANTASY: tu plantilla (fichas con posición y valor/cláusula).",
      tip: "Captura nítida de la lista completa; luego revisa nombres y valores.",
    },
    market: {
      where:
        "En LALIGA FANTASY: mercado o jugadores en venta que quieras analizar.",
      tip: "La cláusula, si se lee bien, se usa como precio mínimo.",
    },
  },
  otro: {
    squad: {
      where:
        "En tu fantasy: abre la plantilla con nombres, posiciones y valores.",
      tip: "Cuanto más limpia sea la captura o el listado, mejor.",
    },
    market: {
      where:
        "En tu fantasy: mercado o los candidatos que estés mirando.",
      tip: "Completa a mano lo que la captura no detecte.",
    },
  },
};

export function PasteImportPanel({
  kind,
  platform = "biwenger",
  onImport,
  defaultOpen = false,
}: {
  kind: ImportKind;
  platform?: PlatformId;
  onImport: (
    players: ParsedPastePlayer[],
    mode: PasteMode,
    meta: PasteMeta,
  ) => void;
  defaultOpen?: boolean;
}) {
  const guide = GUIDE[platform]?.[kind] ?? GUIDE.otro[kind];
  const title =
    kind === "squad"
      ? "Importar plantilla"
      : "Importar mercado";
  const modeName = useId();
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<PasteMode>("replace");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<string | null>(null);

  function importFromText(source: string, fromOcr: boolean) {
    if (!source.trim()) {
      setOpen(true);
      setFeedback(
        `No hay texto que importar. ${getPasteFailureHint(platform, kind)}`,
      );
      return;
    }
    const result = parsePastedPlayers(source);
    if (result.players.length === 0) {
      setOpen(true);
      const base =
        result.warnings[0] ?? "No se detectaron jugadores en el texto.";
      setFeedback(
        `${base} ${
          fromOcr
            ? "Prueba otra captura más nítida o pega texto / añade a mano."
            : getPasteFailureHint(platform, kind)
        }`,
      );
      return;
    }
    onImport(result.players, mode, result.meta);
    const extra = result.warnings.length > 0 ? ` ${result.warnings.join(" ")}` : "";
    const ocrNote = fromOcr
      ? " Revisa nombres y valores: la lectura de imagen puede fallar."
      : "";
    setFeedback(
      `Importados ${result.players.length} jugador${result.players.length === 1 ? "" : "es"}.${extra}${ocrNote}`,
    );
    setText("");
  }

  function handleImport() {
    importFromText(text, false);
  }

  async function pasteFromClipboard() {
    if (!navigator.clipboard?.readText) {
      setFeedback(
        "Este navegador no deja leer el portapapeles. Mantén pulsado el cuadro → Pegar, o usa captura.",
      );
      return;
    }
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip.trim()) {
        setFeedback(
          "El portapapeles está vacío. Copia en tu fantasy, o usa “Importar con captura”.",
        );
        return;
      }
      setText(clip);
      setFeedback(
        "Texto pegado del portapapeles. Pulsa “Importar texto” para cargarlo.",
      );
    } catch {
      setFeedback(
        "No se pudo acceder al portapapeles. Usa captura o pega con el menú del sistema.",
      );
    }
  }

  async function onImageSelected(file: File | undefined) {
    if (!file) return;
    setOpen(true);
    setOcrBusy(true);
    setOcrProgress("Preparando lectura…");
    setFeedback(null);
    try {
      const { text: ocrText, confidence } = await recognizeImageText(
        file,
        (info) => {
          const pct = Math.round(info.progress * 100);
          setOcrProgress(
            pct > 0
              ? `Leyendo captura… ${pct}%`
              : "Descargando motor OCR (solo la primera vez)…",
          );
        },
      );
      if (!ocrText.trim()) {
        setFeedback(
          "No se leyó texto en la imagen. Prueba una captura más clara, sin recortes raros.",
        );
        return;
      }
      setText(ocrText);
      const confNote =
        confidence > 0 && confidence < 55
          ? " La confianza es baja: revisa bien antes de importar."
          : "";
      setFeedback(
        `Texto leído de la captura (${Math.round(confidence)}% confianza). Revísalo abajo y pulsa “Importar texto”.${confNote}`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo leer la captura.";
      setFeedback(message);
    } finally {
      setOcrBusy(false);
      setOcrProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-lime/35 bg-pitch-950/50">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left sm:py-2.5"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-ink">{title}</span>
        <span className="shrink-0 text-xs font-medium text-mist">
          {open ? "Ocultar guía" : "Ver cómo hacerlo"}
        </span>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-[var(--line)] px-3 py-3 sm:py-4">
          <ol className="space-y-2.5 text-sm leading-relaxed text-foam">
            <li className="flex gap-2">
              <span className="font-display w-5 shrink-0 font-bold text-lime">
                1
              </span>
              <span>{guide.where}</span>
            </li>
            <li className="flex gap-2">
              <span className="font-display w-5 shrink-0 font-bold text-lime">
                2
              </span>
              <span>
                <span className="font-semibold text-ink">En la app Biwenger:</span>{" "}
                usa <strong className="text-ink">Compartir</strong> (texto con{" "}
                <strong className="text-ink">#Biwenger</strong>) y pégalo aquí, o{" "}
                <strong className="text-ink">Importar con captura</strong> de la
                lista (no del cartel decorativo).
                <span className="mt-1 block text-mist">
                  En PC: Ctrl+A / Cmd+A en Plantilla o Mercado → copiar → Pegar
                  del portapapeles.
                </span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-display w-5 shrink-0 font-bold text-lime">
                3
              </span>
              <span>
                Revisa el texto detectado, elige sustituir o añadir, y pulsa{" "}
                <strong className="text-ink">Importar texto</strong>.{" "}
                {guide.tip}
              </span>
            </li>
          </ol>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={ocrBusy}
              onClick={() => fileRef.current?.click()}
            >
              {ocrBusy ? "Leyendo captura…" : "Importar con captura"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={ocrBusy}
              onClick={() => void pasteFromClipboard()}
            >
              Pegar del portapapeles
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={handleImport}
              disabled={ocrBusy || !text.trim()}
            >
              Importar texto
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto"
              disabled={ocrBusy}
              onClick={() => {
                setText("");
                setFeedback(null);
              }}
            >
              Limpiar
            </Button>
          </div>

          <input
            ref={fileRef}
            id={fileInputId}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            aria-label={
              kind === "squad"
                ? "Elegir captura de plantilla"
                : "Elegir captura de mercado"
            }
            onChange={(event) => {
              const file = event.target.files?.[0];
              void onImageSelected(file);
            }}
          />

          {ocrProgress ? (
            <p role="status" className="text-sm text-mist">
              {ocrProgress}
            </p>
          ) : null}

          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              kind === "squad"
                ? "Texto de plantilla (pegado o leído de una captura)…"
                : "Texto de mercado (pegado o leído de una captura)…"
            }
            rows={8}
            className="min-h-40 text-base sm:min-h-32 sm:text-sm"
            aria-label={title}
            disabled={ocrBusy}
          />

          <fieldset className="flex flex-col gap-2 text-sm text-foam sm:flex-row sm:flex-wrap sm:gap-4">
            <legend className="sr-only">Modo de importación</legend>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name={modeName}
                className="accent-[var(--lime)]"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
                disabled={ocrBusy}
              />
              Sustituir lista
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name={modeName}
                className="accent-[var(--lime)]"
                checked={mode === "append"}
                onChange={() => setMode("append")}
                disabled={ocrBusy}
              />
              Añadir a lo existente
            </label>
          </fieldset>

          {feedback ? (
            <p
              role="status"
              className={
                feedback.startsWith("Importados") ||
                feedback.startsWith("Texto leído") ||
                feedback.startsWith("Texto pegado")
                  ? "rounded-md border border-lime/30 bg-lime/10 px-3 py-2 text-sm text-foam"
                  : "rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-foam"
              }
            >
              {feedback}
            </p>
          ) : null}

          <p className="text-xs leading-relaxed text-mist">
            Pegado y captura se interpretan en tu dispositivo: la imagen no se
            sube a un servidor de Pujazo. La primera captura puede tardar un poco
            (descarga del motor OCR). Revisa siempre el resultado.
          </p>
        </div>
      ) : null}
    </div>
  );
}
