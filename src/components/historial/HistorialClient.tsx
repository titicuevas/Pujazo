"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/layout/SiteChrome";
import { Badge, Button, Panel, RiskBadge } from "@/components/ui/Primitives";
import {
  clearAnalysisHistory,
  deleteHistoryEntry,
  loadAnalysisHistory,
  restoreHistoryEntry,
  type AnalysisHistoryEntry,
} from "@/lib/storage";
import { analysisTypeLabel } from "@/lib/labels";
import { formatMoney } from "@/lib/format";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  });
}

export function HistorialClient() {
  const router = useRouter();
  const [entries, setEntries] = useState<AnalysisHistoryEntry[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setEntries(loadAnalysisHistory());
    setReady(true);
  }, []);

  useEffect(() => {
    queueMicrotask(refresh);
  }, [refresh]);

  function onOpen(id: string) {
    if (!restoreHistoryEntry(id)) return;
    router.push("/resultado");
  }

  function onDelete(id: string) {
    if (!window.confirm("¿Eliminar este plan del historial?")) return;
    deleteHistoryEntry(id);
    refresh();
  }

  function onClear() {
    if (
      !window.confirm(
        "¿Borrar todo el historial de planes en este dispositivo?",
      )
    ) {
      return;
    }
    clearAnalysisHistory();
    refresh();
  }

  return (
    <PageShell compactHeader>
      <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">
              Historial de planes
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-foam">
              Guarda hasta 15 análisis en este dispositivo. Sirve para no
              perder el plan de la jornada anterior y comparar decisiones.
              No se sube a ningún servidor.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/analizar" className="cta-primary px-4 py-2.5 text-sm">
              Nuevo análisis
            </Link>
            {entries.length > 0 ? (
              <Button type="button" variant="ghost" onClick={onClear}>
                Vaciar historial
              </Button>
            ) : null}
          </div>
        </div>

        {!ready ? (
          <p className="text-mist" role="status">
            Cargando historial…
          </p>
        ) : entries.length === 0 ? (
          <Panel>
            <p className="font-semibold text-ink">Aún no hay planes guardados</p>
            <p className="mt-2 text-sm text-mist">
              Cada vez que pulses “Generar plan”, se añade una entrada aquí
              automáticamente.
            </p>
            <Link
              href="/analizar"
              className="cta-secondary mt-4 inline-flex px-4 py-2.5 text-sm"
            >
              Ir al asistente
            </Link>
          </Panel>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Panel className="!p-3.5 sm:!p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-lg font-semibold text-ink">
                        {entry.title}
                      </p>
                      <p className="mt-1 text-xs text-mist">
                        {formatWhen(entry.savedAt)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge tone="lime">
                          {analysisTypeLabel(entry.input.analysisType)}
                        </Badge>
                        <RiskBadge level={entry.result.overallRisk} />
                        {entry.result.primaryTarget ? (
                          <Badge>
                            Puja{" "}
                            {formatMoney(
                              entry.result.primaryTarget.recommendedBid,
                            )}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-foam">
                        {entry.result.summary}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => onOpen(entry.id)}
                      >
                        Abrir
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => onDelete(entry.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </Panel>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
