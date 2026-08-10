"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const refresh = useCallback(() => {
    setEntries(loadAnalysisHistory());
    setReady(true);
  }, []);

  useEffect(() => {
    queueMicrotask(refresh);
  }, [refresh]);

  const compared = useMemo(() => {
    if (compareIds.length !== 2) return null;
    const a = entries.find((e) => e.id === compareIds[0]);
    const b = entries.find((e) => e.id === compareIds[1]);
    if (!a || !b) return null;
    return [a, b] as const;
  }, [compareIds, entries]);

  function onOpen(id: string) {
    if (!restoreHistoryEntry(id)) return;
    router.push("/resultado");
  }

  function onDelete(id: string) {
    if (!window.confirm("¿Eliminar este plan del historial?")) return;
    deleteHistoryEntry(id);
    setCompareIds((ids) => ids.filter((x) => x !== id));
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
    setCompareIds([]);
    refresh();
  }

  function toggleCompare(id: string) {
    setCompareIds((ids) => {
      if (ids.includes(id)) return ids.filter((x) => x !== id);
      if (ids.length >= 2) return [ids[1], id];
      return [...ids, id];
    });
  }

  return (
    <PageShell compactHeader>
      <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">
              Historial de planes
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-foam">
              Hasta 15 análisis en este dispositivo. Marca dos para comparar
              fichaje y puja. No se sube a ningún servidor.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link
              href="/analizar"
              className="cta-primary w-full px-4 py-2.5 text-center text-sm sm:w-auto"
            >
              Nuevo análisis
            </Link>
            {entries.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={onClear}
              >
                Vaciar historial
              </Button>
            ) : null}
          </div>
        </div>

        {compared ? (
          <Panel className="mb-5 border-lime/35 bg-lime/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-lime">
                Comparativa rápida
              </h2>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCompareIds([])}
              >
                Cerrar
              </Button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {compared.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-[var(--line)] bg-pitch-950/50 px-3 py-3"
                >
                  <p className="text-xs text-mist">{formatWhen(entry.savedAt)}</p>
                  <p className="mt-1 font-semibold text-ink">{entry.title}</p>
                  <p className="mt-2 text-sm text-foam">
                    Fichaje:{" "}
                    <span className="font-semibold text-ink">
                      {entry.result.primaryTarget?.player.name ?? "—"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-foam">
                    Puja:{" "}
                    <span className="font-semibold text-ink">
                      {entry.result.primaryTarget
                        ? formatMoney(entry.result.primaryTarget.recommendedBid)
                        : "—"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-foam">
                    Saldo previsto:{" "}
                    <span className="font-semibold text-ink">
                      {formatMoney(entry.result.projectedBalance)}
                    </span>
                  </p>
                  <Button
                    type="button"
                    className="mt-3 w-full"
                    onClick={() => onOpen(entry.id)}
                  >
                    Abrir este plan
                  </Button>
                </div>
              ))}
            </div>
          </Panel>
        ) : entries.length >= 2 ? (
          <p className="mb-4 text-xs text-mist">
            Tip: pulsa “Comparar” en dos planes para ver fichaje y puja lado a
            lado.
          </p>
        ) : null}

        {!ready ? (
          <p className="text-mist" role="status">
            Repasando el acta…
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
            {entries.map((entry) => {
              const selected = compareIds.includes(entry.id);
              return (
                <li key={entry.id}>
                  <Panel
                    className={`!p-3.5 sm:!p-4 ${selected ? "border-lime/50 bg-lime/5" : ""}`}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold text-ink">
                          {entry.title}
                        </p>
                        <p className="mt-1 text-xs text-mist">
                          {formatWhen(entry.savedAt)}
                        </p>
                        {entry.result.primaryTarget ? (
                          <p className="mt-2 text-sm text-foam">
                            Prioritario:{" "}
                            <span className="font-semibold text-ink">
                              {entry.result.primaryTarget.player.name}
                            </span>{" "}
                            · puja{" "}
                            {formatMoney(
                              entry.result.primaryTarget.recommendedBid,
                            )}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge tone="lime">
                            {analysisTypeLabel(entry.input.analysisType)}
                          </Badge>
                          <RiskBadge level={entry.result.overallRisk} />
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-foam">
                          {entry.result.summary}
                        </p>
                      </div>
                      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Button
                          type="button"
                          className="w-full sm:w-auto"
                          onClick={() => onOpen(entry.id)}
                        >
                          Abrir
                        </Button>
                        <Button
                          type="button"
                          variant={selected ? "secondary" : "ghost"}
                          className="w-full sm:w-auto"
                          onClick={() => toggleCompare(entry.id)}
                        >
                          {selected ? "Quitar comparación" : "Comparar"}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          className="w-full sm:w-auto"
                          onClick={() => onDelete(entry.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </Panel>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
