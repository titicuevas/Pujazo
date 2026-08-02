"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { PageShell } from "@/components/layout/SiteChrome";
import {
  Badge,
  Button,
  Panel,
  RiskBadge,
} from "@/components/ui/Primitives";
import {
  analysisToPlainText,
  copyText,
  downloadTextFile,
  shareAnalysis,
} from "@/lib/export";
import { formatMoney } from "@/lib/format";
import type { AnalysisResult } from "@/lib/types";
import { POSITION_OPTIONS } from "@/lib/constants";
import { STORAGE_KEYS } from "@/lib/constants";

let cachedRaw: string | null | undefined;
let cachedResult: AnalysisResult | null = null;

function subscribe(onStoreChange: () => void) {
  const handler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEYS.lastAnalysis || event.key === null) {
      cachedRaw = undefined;
      onStoreChange();
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getClientAnalysis(): AnalysisResult | null {
  const raw = localStorage.getItem(STORAGE_KEYS.lastAnalysis);
  if (raw === cachedRaw) return cachedResult;
  cachedRaw = raw;
  if (!raw) {
    cachedResult = null;
    return null;
  }
  try {
    cachedResult = (JSON.parse(raw) as { result: AnalysisResult }).result;
  } catch {
    cachedResult = null;
  }
  return cachedResult;
}

function getServerAnalysis(): AnalysisResult | null {
  return null;
}

export default function ResultadoPage() {
  const result = useSyncExternalStore(
    subscribe,
    getClientAnalysis,
    getServerAnalysis,
  );
  const [status, setStatus] = useState<string | null>(null);

  const text = useMemo(
    () => (result ? analysisToPlainText(result) : ""),
    [result],
  );

  const positionLabel = (id: string) =>
    POSITION_OPTIONS.find((p) => p.id === id)?.label ?? id;

  if (!result) {
    return (
      <PageShell compactHeader>
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <h1 className="font-display text-3xl font-bold text-ink">
            Sin análisis guardado
          </h1>
          <p className="mt-3 text-mist">
            Aún no hay un resultado en este dispositivo. Completa el asistente
            para generar un plan.
          </p>
          <Link
            href="/analizar"
            className="mt-6 inline-flex rounded-md bg-lime px-4 py-2.5 text-sm font-semibold text-on-lime"
          >
            Analizar mi equipo
          </Link>
        </div>
      </PageShell>
    );
  }

  const generatedAt = result.generatedAt;

  async function onCopy() {
    const ok = await copyText(text);
    setStatus(ok ? "Resultado copiado al portapapeles." : "No se pudo copiar.");
  }

  function onDownload() {
    downloadTextFile(
      `pujazo-analisis-${generatedAt.slice(0, 10)}.txt`,
      text,
    );
    setStatus("Descarga iniciada.");
  }

  async function onShare() {
    const ok = await shareAnalysis(text);
    setStatus(
      ok
        ? "Compartido."
        : "La API Web Share no está disponible en este dispositivo.",
    );
  }

  return (
    <PageShell compactHeader>
      <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 sm:mb-5">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">
              Tu plan de acción
            </h1>
            <p className="mt-1 text-sm text-mist">
              Generado en local ·{" "}
              {new Date(result.generatedAt).toLocaleString("es-ES")}
            </p>
          </div>
          <RiskBadge level={result.overallRisk} />
        </div>

        {status ? (
          <p role="status" className="mb-4 text-sm text-lime">
            {status}
          </p>
        ) : null}

        <div className="mb-4 flex flex-wrap gap-2 sm:mb-5">
          <Link
            href="/analizar"
            className="inline-flex items-center justify-center rounded-md border border-[var(--line)] bg-pitch-800 px-4 py-2.5 text-sm font-medium text-ink"
          >
            Editar datos
          </Link>
          <Link
            href="/analizar"
            className="inline-flex items-center justify-center rounded-md border border-[var(--line)] bg-pitch-800 px-4 py-2.5 text-sm font-medium text-ink"
          >
            Empezar otro análisis
          </Link>
          <Button type="button" variant="secondary" onClick={onCopy}>
            Copiar resultado
          </Button>
          <Button type="button" variant="secondary" onClick={onDownload}>
            Descargar análisis
          </Button>
          <Button type="button" variant="ghost" onClick={onShare}>
            Compartir
          </Button>
        </div>

        <div className="space-y-4">
          <Panel>
            <h2 className="font-display text-xl font-semibold text-lime">
              Resumen general
            </h2>
            <p className="mt-2 text-foam">{result.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {result.mustSellBeforeBuy ? (
                <Badge tone="risky">Vender antes de fichar</Badge>
              ) : (
                <Badge tone="safe">Cupo/saldo permite fichar</Badge>
              )}
              <Badge tone="lime">
                Saldo previsto: {formatMoney(result.projectedBalance)}
              </Badge>
            </div>
          </Panel>

          {result.primaryTarget ? (
            <Panel>
              <h2 className="font-display text-xl font-semibold text-lime">
                Fichaje prioritario
              </h2>
              <p className="mt-2 text-lg font-semibold text-ink">
                {result.primaryTarget.player.name}{" "}
                <span className="text-sm font-normal text-mist">
                  ({positionLabel(result.primaryTarget.player.position)})
                </span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <RiskBadge level={result.primaryTarget.risk} />
                <Badge>
                  Puntuación local {result.primaryTarget.score}
                </Badge>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-mist">Puja recomendada</dt>
                  <dd className="text-lg font-semibold text-lime">
                    {formatMoney(
                      result.recommendedBid ??
                        result.primaryTarget.recommendedBid,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-mist">Puja máxima</dt>
                  <dd className="text-lg font-semibold text-amber">
                    {formatMoney(
                      result.maxBid ?? result.primaryTarget.maxBid,
                    )}
                  </dd>
                </div>
              </dl>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-mist">
                {result.primaryTarget.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {result.alternativeTarget ? (
            <Panel>
              <h2 className="font-display text-xl font-semibold text-lime">
                Segunda alternativa
              </h2>
              <p className="mt-2 font-semibold text-ink">
                {result.alternativeTarget.player.name}
              </p>
              <p className="text-sm text-mist">
                Puja recomendada{" "}
                {formatMoney(result.alternativeTarget.recommendedBid)} · máxima{" "}
                {formatMoney(result.alternativeTarget.maxBid)}
              </p>
            </Panel>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Panel>
              <h2 className="font-display text-lg font-semibold text-lime">
                Ventas recomendadas
              </h2>
              {result.sellRecommendations.length === 0 ? (
                <p className="mt-2 text-sm text-mist">
                  No hay ventas prioritarias con los datos actuales.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {result.sellRecommendations.map((player) => (
                    <li
                      key={player.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span>{player.name}</span>
                      <span className="text-mist">
                        {formatMoney(player.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel>
              <h2 className="font-display text-lg font-semibold text-lime">
                No vender
              </h2>
              {result.doNotSell.length === 0 ? (
                <p className="mt-2 text-sm text-mist">
                  No marcaste jugadores intocables.
                </p>
              ) : (
                <ul className="mt-3 space-y-1 text-sm">
                  {result.doNotSell.map((player) => (
                    <li key={player.id}>{player.name}</li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {result.lineup ? (
            <Panel>
              <h2 className="font-display text-xl font-semibold text-lime">
                Once recomendado
              </h2>
              <p className="mt-1 text-sm text-mist">
                Formación {result.lineup.formation}
              </p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {result.lineup.starters.map((slot) => (
                  <li
                    key={`${slot.position}-${slot.player.id}`}
                    className="flex items-center justify-between rounded-md border border-[var(--line)] px-3 py-2 text-sm"
                  >
                    <span className="text-mist">
                      {positionLabel(slot.position)}
                    </span>
                    <span className="font-medium text-ink">
                      {slot.player.name}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {result.lineup.captain ? (
                  <Badge tone="lime">
                    Capitán: {result.lineup.captain.name}
                  </Badge>
                ) : null}
                {result.lineup.striker ? (
                  <Badge tone="balanced">
                    Ariete: {result.lineup.striker.name}
                  </Badge>
                ) : null}
              </div>
            </Panel>
          ) : null}

          <Panel>
            <h2 className="font-display text-lg font-semibold text-lime">
              Motivos
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-mist">
              {result.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <h2 className="font-display text-lg font-semibold text-lime">
              Plan alternativo
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-mist">
              {result.alternativePlan.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <h2 className="font-display text-lg font-semibold text-lime">
              Datos que faltan
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-mist">
              {result.missingData.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Panel>

          <Panel className="border-amber/30 bg-amber/10">
            <h2 className="font-display text-lg font-semibold text-amber">
              Advertencias
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foam">
              {result.warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
              <li>
                No se utilizan datos deportivos en tiempo real, lesiones
                oficiales, rivales ni noticias.
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
