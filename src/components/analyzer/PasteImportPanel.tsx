"use client";

import { useState } from "react";
import { Button, TextArea } from "@/components/ui/Primitives";
import {
  parsePastedPlayers,
  type ParsedPastePlayer,
} from "@/lib/importPaste";

type PasteMode = "replace" | "append";

export function PasteImportPanel({
  title,
  hint,
  onImport,
}: {
  title: string;
  hint: string;
  onImport: (players: ParsedPastePlayer[], mode: PasteMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<PasteMode>("replace");
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleImport() {
    const result = parsePastedPlayers(text);
    if (result.players.length === 0) {
      setFeedback(result.warnings[0] ?? "No se detectaron jugadores.");
      return;
    }
    onImport(result.players, mode);
    const extra =
      result.warnings.length > 0 ? ` ${result.warnings[0]}` : "";
    setFeedback(
      `Importados ${result.players.length} jugador${result.players.length === 1 ? "" : "es"}.${extra}`,
    );
    setText("");
  }

  return (
    <div className="rounded-lg border border-[var(--line)] bg-pitch-950/40">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-semibold text-foam hover:text-ink"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="text-xs font-medium text-mist">
          {open ? "Ocultar" : "Mostrar"}
        </span>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-[var(--line)] px-3 py-3">
          <p className="text-xs leading-relaxed text-mist">{hint}</p>
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              "Ejemplo:\nK. Rivas POR 4.500.000\nY. Cordero DEL 9.450.000\nH. Ballester"
            }
            rows={6}
            aria-label={title}
          />
          <fieldset className="flex flex-wrap gap-4 text-sm text-foam">
            <legend className="sr-only">Modo de importación</legend>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name={`${title}-mode`}
                className="accent-[var(--lime)]"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
              />
              Sustituir lista
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name={`${title}-mode`}
                className="accent-[var(--lime)]"
                checked={mode === "append"}
                onChange={() => setMode("append")}
              />
              Añadir a lo existente
            </label>
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleImport}>
              Importar pegado
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setText("");
                setFeedback(null);
              }}
            >
              Limpiar
            </Button>
          </div>
          {feedback ? (
            <p role="status" className="text-sm text-foam">
              {feedback}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
