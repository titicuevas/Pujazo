"use client";

import { useId, useState } from "react";
import { Button, TextArea } from "@/components/ui/Primitives";
import {
  getPasteFailureHint,
  parsePastedPlayers,
  type ParsedPastePlayer,
  type PasteMeta,
} from "@/lib/importPaste";
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
        "En Biwenger: Equipo → pestaña Plantilla (la lista con valores y “Vender”).",
      tip: "Evita la pestaña de alineación: copia la lista de plantilla.",
    },
    market: {
      where:
        "En Biwenger: Mercado (jugadores en venta/puja). Evita “Todos los jugadores”.",
      tip: "Si aparece cláusula, la usamos como precio mínimo.",
    },
  },
  comunio: {
    squad: {
      where:
        "En Comunio: abre tu equipo / plantilla (lista de jugadores con valor).",
      tip: "Copia el listado completo; si salen clubes o puntos, Pujazo los ignora.",
    },
    market: {
      where:
        "En Comunio: mercado u ofertas con nombres, posición y valor.",
      tip: "Revisa después las pujas: Comunio no siempre trae precio mínimo claro.",
    },
  },
  laliga_fantasy: {
    squad: {
      where:
        "En LALIGA FANTASY: tu plantilla (fichas con posición y valor/cláusula).",
      tip: "Si el pegado trae “Valor” o “Cláusula”, los usamos automáticamente.",
    },
    market: {
      where:
        "En LALIGA FANTASY: mercado o jugadores en venta que quieras analizar.",
      tip: "La cláusula, si aparece, se usa como referencia de precio mínimo.",
    },
  },
  otro: {
    squad: {
      where:
        "En tu fantasy: abre la plantilla con nombres, posiciones y valores.",
      tip: "Cuanto más limpio sea el listado (nombre + posición + valor), mejor.",
    },
    market: {
      where:
        "En tu fantasy: copia el mercado o los candidatos que estés mirando.",
      tip: "Puedes completar a mano lo que el pegado no detecte.",
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
      ? "Pegar plantilla (recomendado)"
      : "Pegar mercado (recomendado)";
  const modeName = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<PasteMode>("replace");
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleImport() {
    if (!text.trim()) {
      setOpen(true);
      setFeedback(
        `No hay texto que importar. ${getPasteFailureHint(platform, kind)}`,
      );
      return;
    }
    const result = parsePastedPlayers(text);
    if (result.players.length === 0) {
      setOpen(true);
      const base =
        result.warnings[0] ?? "No se detectaron jugadores en el texto pegado.";
      setFeedback(`${base} ${getPasteFailureHint(platform, kind)}`);
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
          "El portapapeles está vacío. Primero copia en tu fantasy y vuelve.",
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
                <strong className="text-ink">Importar pegado</strong>.{" "}
                {guide.tip} Completa a mano lo que falte antes de seguir.
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
            aria-label={title}
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
              className={
                feedback.startsWith("Importados")
                  ? "rounded-md border border-lime/30 bg-lime/10 px-3 py-2 text-sm text-foam"
                  : "rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-foam"
              }
            >
              {feedback}
            </p>
          ) : null}

          <p className="text-xs leading-relaxed text-mist">
            Todo el pegado se interpreta en tu dispositivo: no se envía a ningún
            servidor. Si el navegador bloquea el portapapeles, pega con el menú
            del sistema dentro del cuadro.
          </p>
        </div>
      ) : null}
    </div>
  );
}
