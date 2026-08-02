"use client";

import { useId, useState } from "react";
import { Button, TextArea } from "@/components/ui/Primitives";
import {
  parsePastedPlayers,
  type ParsedPastePlayer,
  type PasteMeta,
} from "@/lib/importPaste";

type PasteMode = "replace" | "append";
type ImportKind = "squad" | "market";

const COPY: Record<
  ImportKind,
  {
    title: string;
    where: string;
    after: string;
  }
> = {
  squad: {
    title: "Pegar plantilla (recomendado)",
    where: "En Biwenger: Equipo → pestaña Plantilla (la lista con valores y “Vender”).",
    after:
      "Revisa nombres, posiciones y valores. Completa a mano lo que falte antes de seguir.",
  },
  market: {
    title: "Pegar mercado (recomendado)",
    where: "En Biwenger: Mercado (la cuadrícula de jugadores en venta/puja). Evita “Todos los jugadores”.",
    after:
      "Si aparece cláusula, la usamos como precio mínimo. Ajusta pujas después si hace falta.",
  },
};

export function PasteImportPanel({
  kind,
  onImport,
  defaultOpen = false,
}: {
  kind: ImportKind;
  onImport: (
    players: ParsedPastePlayer[],
    mode: PasteMode,
    meta: PasteMeta,
  ) => void;
  defaultOpen?: boolean;
}) {
  const copy = COPY[kind];
  const modeName = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<PasteMode>("replace");
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleImport() {
    const result = parsePastedPlayers(text);
    if (result.players.length === 0) {
      setFeedback(result.warnings[0] ?? "No se detectaron jugadores.");
      return;
    }
    onImport(result.players, mode, result.meta);
    const extra = result.warnings.length > 0 ? ` ${result.warnings.join(" ")}` : "";
    setFeedback(
      `Importados ${result.players.length} jugador${result.players.length === 1 ? "" : "es"}.${extra}`,
    );
    setText("");
  }

  async function pasteFromClipboard() {
    if (!navigator.clipboard?.readText) {
      setFeedback(
        "Este navegador no deja leer el portapapeles. Mantén pulsado el cuadro → Pegar.",
      );
      return;
    }
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip.trim()) {
        setFeedback(
          "El portapapeles está vacío. Primero copia en Biwenger y vuelve.",
        );
        return;
      }
      setText(clip);
      setFeedback(
        "Texto pegado del portapapeles. Pulsa “Importar pegado” para cargarlo.",
      );
    } catch {
      setFeedback(
        "No se pudo acceder al portapapeles (permiso o HTTPS). Mantén pulsado el cuadro → Pegar.",
      );
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
        <span className="text-sm font-semibold text-ink">{copy.title}</span>
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
              <span>{copy.where}</span>
            </li>
            <li className="flex gap-2">
              <span className="font-display w-5 shrink-0 font-bold text-lime">
                2
              </span>
              <span>
                <span className="font-semibold text-ink">En el móvil o tablet:</span>{" "}
                mantén pulsado → <strong className="text-ink">Seleccionar todo</strong>{" "}
                → <strong className="text-ink">Copiar</strong>.
                <span className="mt-1 block text-mist">
                  En el ordenador: Ctrl+A (o Cmd+A) y luego Ctrl+C (o Cmd+C).
                </span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-display w-5 shrink-0 font-bold text-lime">
                3
              </span>
              <span>
                Vuelve a Pujazo y pulsa{" "}
                <strong className="text-ink">Pegar del portapapeles</strong>, o
                pega a mano en el cuadro de abajo.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-display w-5 shrink-0 font-bold text-lime">
                4
              </span>
              <span>
                Elige sustituir o añadir, pulsa{" "}
                <strong className="text-ink">Importar pegado</strong>. {copy.after}
              </span>
            </li>
          </ol>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" className="w-full sm:w-auto" onClick={pasteFromClipboard}>
              Pegar del portapapeles
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={handleImport}
              disabled={!text.trim()}
            >
              Importar pegado
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => {
                setText("");
                setFeedback(null);
              }}
            >
              Limpiar
            </Button>
          </div>

          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              kind === "squad"
                ? "Aquí debe aparecer el texto copiado de tu plantilla…"
                : "Aquí debe aparecer el texto copiado de tu mercado…"
            }
            rows={8}
            className="min-h-40 text-base sm:min-h-32 sm:text-sm"
            aria-label={copy.title}
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
              />
              Añadir a lo existente
            </label>
          </fieldset>

          {feedback ? (
            <p
              role="status"
              className="rounded-md border border-lime/30 bg-lime/10 px-3 py-2 text-sm text-foam"
            >
              {feedback}
            </p>
          ) : null}

          <p className="text-xs leading-relaxed text-mist">
            No hace falta captura de pantalla: el texto se lee mejor y funciona
            en móvil, tablet y PC. Si el navegador bloquea el portapapeles,
            pega con el menú del sistema dentro del cuadro.
          </p>
        </div>
      ) : null}
    </div>
  );
}
