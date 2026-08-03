"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

function positionLabel(id: string) {
  return POSITION_OPTIONS.find((p) => p.id === id)?.label ?? id;
}

function formatGeneratedAt(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  });
}

export function ResultEmptyState() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-3xl font-bold text-ink">
        Sin análisis guardado
      </h1>
      <p className="mt-3 text-foam">
        Aún no hay un resultado en este dispositivo. Completa el asistente o
        carga los datos de ejemplo para generar un plan en segundos.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/analizar" className="cta-primary px-4 py-2.5 text-sm">
          Analizar mi equipo
        </Link>
        <Link href="/historial" className="cta-secondary px-4 py-2.5 text-sm">
          Ver historial
        </Link>
        <Link href="/" className="cta-secondary px-4 py-2.5 text-sm">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

export function ResultPlan({ result }: { result: AnalysisResult }) {
  const [status, setStatus] = useState<string | null>(null);
  const text = useMemo(() => analysisToPlainText(result), [result]);
  const bid =
    result.recommendedBid ?? result.primaryTarget?.recommendedBid;
  const maxBid = result.maxBid ?? result.primaryTarget?.maxBid;

  async function onCopy() {
    const ok = await copyText(text);
    setStatus(
      ok ? "Plan copiado. Ya puedes pegarlo donde quieras." : "No se pudo copiar.",
    );
  }

  function onDownload() {
    downloadTextFile(
      `pujazo-analisis-${result.generatedAt.slice(0, 10)}.txt`,
      text,
    );
    setStatus("Descarga iniciada.");
  }

  async function onShare() {
    const ok = await shareAnalysis(text);
    setStatus(
      ok
        ? "Compartido."
        : "Comparte no disponible aquí: usa Copiar o Descargar.",
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-8 print:max-w-none print:px-0 print:py-0">
      <div className="mb-4 hidden print:block">
        <p className="font-display text-2xl font-extrabold text-black">Pujazo</p>
        <p className="text-sm text-neutral-600">
          Plan de acción · {formatGeneratedAt(result.generatedAt)}
        </p>
      </div>

      <header className="mb-4 flex flex-wrap items-start justify-between gap-3 sm:mb-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-mist">
            Resultado local
          </p>
          <h1 className="font-display mt-1 text-3xl font-bold text-ink sm:text-4xl">
            Tu plan de acción
          </h1>
          <p className="mt-1 text-sm text-mist">
            Generado en este dispositivo · {formatGeneratedAt(result.generatedAt)}
          </p>
        </div>
        <RiskBadge level={result.overallRisk} />
      </header>

      {status ? (
        <div
          role="status"
          className="mb-4 flex items-start justify-between gap-3 rounded-md border border-lime/30 bg-lime/10 px-3 py-2 text-sm text-foam"
        >
          <p className="min-w-0">{status}</p>
          <button
            type="button"
            className="shrink-0 text-mist underline-offset-2 hover:text-ink hover:underline"
            onClick={() => setStatus(null)}
            aria-label="Cerrar aviso"
          >
            Cerrar
          </button>
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2 print:hidden">
        <Button type="button" onClick={onCopy}>
          Copiar plan
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            window.print();
            setStatus(
              "Si eliges «Guardar como PDF» en el diálogo de impresión, tendrás el plan fuera del navegador.",
            );
          }}
        >
          Guardar PDF / Imprimir
        </Button>
        <Button type="button" variant="secondary" onClick={onDownload}>
          Descargar .txt
        </Button>
        <Button type="button" variant="ghost" onClick={onShare}>
          Compartir
        </Button>
        <Link href="/historial" className="cta-secondary px-4 py-2.5 text-sm">
          Historial
        </Link>
        <Link href="/analizar" className="cta-secondary px-4 py-2.5 text-sm">
          Editar datos
        </Link>
      </div>

      <Panel className="mb-4 border-lime/40 bg-lime/5">
        <h2 className="font-display text-xl font-semibold text-lime">
          En una frase
        </h2>
        <p className="mt-2 text-base leading-relaxed text-ink sm:text-lg">
          {result.summary}
        </p>
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

      <div className="space-y-4">
        {result.primaryTarget ? (
          <PrimaryTarget
            result={result}
            bid={bid}
            maxBid={maxBid}
          />
        ) : null}

        {result.marketRanking && result.marketRanking.length > 1 ? (
          <MarketRankingPanel ranking={result.marketRanking} />
        ) : result.alternativeTarget ? (
          <Panel>
            <h2 className="font-display text-lg font-semibold text-lime">
              Plan B · segunda alternativa
            </h2>
            <p className="mt-2 text-lg font-semibold text-ink">
              {result.alternativeTarget.player.name}
            </p>
            <p className="mt-1 text-sm text-foam">
              Puja recomendada{" "}
              <span className="font-semibold text-ink">
                {formatMoney(result.alternativeTarget.recommendedBid)}
              </span>
              {" · "}
              máxima{" "}
              <span className="font-semibold text-ink">
                {formatMoney(result.alternativeTarget.maxBid)}
              </span>
            </p>
          </Panel>
        ) : null}

        <SalesGrid result={result} />

        {result.lineup ? <LineupPanel result={result} /> : null}

        <ReasonsGrid result={result} />

        <WarningsPanel result={result} />

        <div className="flex flex-wrap gap-2 border-t border-[var(--line)] pt-5 print:hidden">
          <Link href="/analizar" className="cta-primary px-4 py-2.5 text-sm">
            Ajustar y volver a analizar
          </Link>
          <Link href="/historial" className="cta-secondary px-4 py-2.5 text-sm">
            Ver historial
          </Link>
          <Link href="/" className="cta-secondary px-4 py-2.5 text-sm">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function PrimaryTarget({
  result,
  bid,
  maxBid,
}: {
  result: AnalysisResult;
  bid?: number;
  maxBid?: number;
}) {
  const target = result.primaryTarget;
  if (!target) return null;

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-display text-xl font-semibold text-lime">
          Fichaje prioritario
        </h2>
        <RiskBadge level={target.risk} />
      </div>
      <p className="mt-2 text-xl font-semibold text-ink sm:text-2xl">
        {target.player.name}{" "}
        <span className="text-sm font-normal text-mist">
          · {positionLabel(target.player.position)}
        </span>
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--line)] bg-pitch-950/50 px-3 py-3">
          <dt className="text-xs text-mist">Puja recomendada</dt>
          <dd className="mt-1 text-2xl font-bold text-[#04110c]">
            <span className="inline-block rounded bg-[var(--cta-bg)] px-2 py-0.5">
              {formatMoney(bid ?? target.recommendedBid)}
            </span>
          </dd>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-pitch-950/50 px-3 py-3">
          <dt className="text-xs text-mist">Puja máxima</dt>
          <dd className="mt-1 text-2xl font-bold text-amber">
            {formatMoney(maxBid ?? target.maxBid)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-mist">
        Puntuación local del motor: {target.score}
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foam">
        {target.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </Panel>
  );
}

function MarketRankingPanel({
  ranking,
}: {
  ranking: NonNullable<AnalysisResult["marketRanking"]>;
}) {
  const title =
    ranking.length <= 3
      ? `Top ${ranking.length} fichajes`
      : "Comparativa de candidatos";

  return (
    <Panel>
      <h2 className="font-display text-xl font-semibold text-lime">{title}</h2>
      <p className="mt-1 text-sm text-mist">
        Ordenados por tu estrategia, cupo y saldo. El nº 1 es el fichaje
        prioritario; 2 y 3 son alternativas reales si se te escapa.
      </p>

      <ol className="mt-4 space-y-3">
        {ranking.map((item, index) => (
          <li
            key={item.player.id}
            className="rounded-lg border border-[var(--line)] bg-pitch-950/40 px-3 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-lime">
                  #{index + 1}
                  {index === 0 ? " · prioritario" : null}
                </p>
                <p className="mt-1 text-lg font-semibold text-ink">
                  {item.player.name}{" "}
                  <span className="text-sm font-normal text-mist">
                    · {positionLabel(item.player.position)}
                  </span>
                </p>
                <p className="mt-1 text-sm text-foam">
                  Puja{" "}
                  <span className="font-semibold text-ink">
                    {formatMoney(item.recommendedBid)}
                  </span>
                  {" · "}
                  máx.{" "}
                  <span className="font-semibold text-ink">
                    {formatMoney(item.maxBid)}
                  </span>
                  {" · "}
                  score {item.score}
                </p>
              </div>
              <RiskBadge level={item.risk} />
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function SalesGrid({ result }: { result: AnalysisResult }) {
  return (
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
                className="flex items-center justify-between gap-2 rounded-md border border-[var(--line)] bg-pitch-950/40 px-3 py-2 text-sm"
              >
                <span className="font-medium text-ink">{player.name}</span>
                <span className="text-mist">{formatMoney(player.value)}</span>
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
          <ul className="mt-3 space-y-1 text-sm text-foam">
            {result.doNotSell.map((player) => (
              <li key={player.id}>{player.name}</li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function LineupPanel({ result }: { result: AnalysisResult }) {
  const lineup = result.lineup;
  if (!lineup) return null;

  return (
    <Panel>
      <h2 className="font-display text-xl font-semibold text-lime">
        Once recomendado
      </h2>
      <p className="mt-1 text-sm text-mist">Formación {lineup.formation}</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {lineup.starters.map((slot) => (
          <li
            key={`${slot.position}-${slot.player.id}`}
            className="flex items-center justify-between rounded-md border border-[var(--line)] bg-pitch-950/40 px-3 py-2 text-sm"
          >
            <span className="text-mist">{positionLabel(slot.position)}</span>
            <span className="font-medium text-ink">{slot.player.name}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        {lineup.captain ? (
          <Badge tone="lime">Capitán: {lineup.captain.name}</Badge>
        ) : null}
        {lineup.striker ? (
          <Badge tone="balanced">Ariete: {lineup.striker.name}</Badge>
        ) : null}
      </div>
    </Panel>
  );
}

function ReasonsGrid({ result }: { result: AnalysisResult }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel>
        <h2 className="font-display text-lg font-semibold text-lime">Motivos</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foam">
          {result.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </Panel>
      <Panel>
        <h2 className="font-display text-lg font-semibold text-lime">
          Plan alternativo
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foam">
          {result.alternativePlan.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function WarningsPanel({ result }: { result: AnalysisResult }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {result.missingData.length > 0 ? (
        <Panel>
          <h2 className="font-display text-lg font-semibold text-lime">
            Datos que faltan
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foam">
            {result.missingData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Panel>
      ) : null}
      <Panel
        className={`border-amber/30 bg-amber/10 ${result.missingData.length === 0 ? "md:col-span-2" : ""}`}
      >
        <h2 className="font-display text-lg font-semibold text-amber">
          Advertencias
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foam">
          {result.warnings.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>
            No se utilizan datos deportivos en tiempo real, lesiones oficiales,
            rivales ni noticias.
          </li>
        </ul>
      </Panel>
    </div>
  );
}
