import { buildLineup } from "@/lib/analysis/lineup";
import {
  countByPosition,
  excessPositions,
  mustSellBeforeBuying,
  overallRiskFromScores,
  pickSellCandidates,
  projectedBalanceAfter,
  scoreMarketPlayer,
  squadNeeds,
} from "@/lib/analysis/scoring";
import type { AnalysisInput, AnalysisResult, ScoredMarketPlayer } from "@/lib/types";

function collectMissingData(input: AnalysisInput): string[] {
  const missing: string[] = [];
  if (input.squad.length < 11) {
    missing.push(
      "Plantilla incompleta para generar una alineación fiable (mínimo 11).",
    );
  }
  if (input.market.length === 0) {
    missing.push("No hay jugadores en el mercado para recomendar fichajes.");
  }
  if (!input.concreteDoubt?.trim()) {
    missing.push(
      "No se indicó una duda concreta; el plan es genérico según el tipo de análisis.",
    );
  }
  const needs = squadNeeds(input.squad);
  if (needs.includes("portero")) {
    missing.push("Falta al menos un portero en la plantilla.");
  }
  for (const need of needs.filter((n) => n !== "portero")) {
    missing.push(`Pueden faltar ${need}s según una distribución habitual.`);
  }
  const withoutStatus = input.squad.filter((p) => !p.status);
  if (withoutStatus.length > 0) {
    missing.push("Algunos jugadores no tienen estado informado.");
  }
  const marketWithoutBid = input.market.filter(
    (p) => p.estimatedBid == null && p.minPrice == null,
  );
  if (marketWithoutBid.length > 0) {
    missing.push(
      "Faltan pujas estimadas o precios mínimos en parte del mercado; se usa el valor de mercado.",
    );
  }
  missing.push(
    "No se utilizan datos deportivos en tiempo real, lesiones oficiales, rivales ni noticias.",
  );
  return missing;
}

function buildSummary(
  input: AnalysisInput,
  primary?: ScoredMarketPlayer,
  mustSell?: boolean,
): string {
  const platform =
    input.platform === "otro"
      ? input.customPlatformName || "tu fantasy"
      : input.platform === "laliga_fantasy"
        ? "LALIGA FANTASY"
        : input.platform.charAt(0).toUpperCase() + input.platform.slice(1);

  if (input.analysisType === "alineacion") {
    return `Análisis de alineación para ${platform} (estrategia ${input.strategy}). El once se elige solo con los datos que has introducido.`;
  }
  if (input.analysisType === "ventas") {
    return `Revisión de ventas para liberar cupo o saldo en ${platform}.`;
  }
  if (primary) {
    return mustSell
      ? `Para fichar a ${primary.player.name} en ${platform} necesitas vender antes y pujar con margen según tu estrategia ${input.strategy}.`
      : `Fichaje prioritario sugerido: ${primary.player.name}. Plan orientado a estrategia ${input.strategy} en ${platform}.`;
  }
  return `Revisión ${input.analysisType} para ${platform}. Revisa ventas, cupo y datos faltantes.`;
}

export function analyzeTeam(input: AnalysisInput): AnalysisResult {
  const scored = input.market
    .map((player) => scoreMarketPlayer(player, input))
    .sort((a, b) => b.score - a.score);

  const primary =
    input.analysisType === "alineacion" || input.analysisType === "ventas"
      ? undefined
      : scored[0];
  const alternative = primary ? scored[1] : undefined;

  const buyCost = primary?.recommendedBid ?? 0;
  const slotsNeeded = input.squad.length >= input.maxPlayers ? 1 : 0;
  const fundsGap = Math.max(0, buyCost - input.balance);
  const mustSell = primary
    ? mustSellBeforeBuying({
        squadSize: input.squad.length,
        maxPlayers: input.maxPlayers,
        balance: input.balance,
        buyCost,
        allowNegativeBalance: input.allowNegativeBalance,
      })
    : input.squad.length > input.maxPlayers;

  const sellRecommendations =
    input.analysisType === "alineacion" || input.analysisType === "capitan"
      ? []
      : pickSellCandidates(input.squad, fundsGap, slotsNeeded || (mustSell ? 1 : 0));

  const doNotSell = input.squad.filter((p) => p.doNotSell);
  const projected = projectedBalanceAfter(
    input.balance,
    sellRecommendations.map((p) => p.value),
    buyCost,
  );

  const includeLineup =
    input.analysisType === "alineacion" ||
    input.analysisType === "capitan" ||
    input.analysisType === "completo";

  const lineup = includeLineup
    ? buildLineup(input.squad, input.rules) ?? undefined
    : undefined;

  const reasons: string[] = [];
  const counts = countByPosition(input.squad);
  reasons.push(
    `Plantilla: ${input.squad.length}/${input.maxPlayers} (POR ${counts.portero}, DEF ${counts.defensa}, CEN ${counts.centrocampista}, DEL ${counts.delantero}).`,
  );

  if (primary) {
    reasons.push(
      ...primary.reasons.map((r) => `${primary.player.name}: ${r}`),
    );
  }
  if (mustSell) {
    reasons.push(
      "Es necesario vender antes de fichar por cupo y/o saldo insuficiente.",
    );
  }
  for (const excess of excessPositions(input.squad)) {
    reasons.push(`Hay exceso de ${excess}s; prioriza ventas en esa posición.`);
  }
  if (input.concreteDoubt?.trim()) {
    reasons.push(`Duda del usuario: ${input.concreteDoubt.trim()}`);
  }
  if (lineup?.captain) {
    reasons.push(`Capitán recomendado: ${lineup.captain.name}.`);
  }
  if (lineup?.striker) {
    reasons.push(`Ariete recomendado: ${lineup.striker.name}.`);
  }

  const alternativePlan: string[] = [];
  if (alternative) {
    alternativePlan.push(
      `Si pierdes a ${primary?.player.name}, intenta ${alternative.player.name} con puja ~${alternative.recommendedBid.toLocaleString("es-ES")} €.`,
    );
  }
  if (sellRecommendations.length > 0) {
    alternativePlan.push(
      `Plan B de ventas: ${sellRecommendations.map((p) => p.name).join(", ")}.`,
    );
  }
  if (!primary && input.market.length === 0) {
    alternativePlan.push(
      "Añade candidatos de mercado o céntrate en ventas y alineación con la plantilla actual.",
    );
  }
  if (projected < 500_000 && primary) {
    alternativePlan.push(
      "Si el margen queda justo, baja la puja máxima o vende un perfil adicional no marcado como intocable.",
    );
  }

  const warnings: string[] = [
    "Este plan es determinista y local: no hay IA ni datos en vivo.",
    "No automatiza fichajes, pujas, ventas ni alineaciones en ninguna plataforma.",
  ];
  if (input.squad.length > input.maxPlayers) {
    warnings.push(
      `Has superado el máximo permitido (${input.maxPlayers}). Debes vender.`,
    );
  }
  if (lineup == null && includeLineup) {
    warnings.push(
      "No se pudo generar un once válido con las posiciones disponibles.",
    );
  }

  return {
    summary: buildSummary(input, primary, mustSell),
    primaryTarget: primary,
    alternativeTarget: alternative,
    recommendedBid: primary?.recommendedBid,
    maxBid: primary?.maxBid,
    sellRecommendations,
    doNotSell,
    projectedBalance: projected,
    mustSellBeforeBuy: mustSell,
    lineup,
    overallRisk: overallRiskFromScores(scored, mustSell, projected),
    reasons,
    alternativePlan,
    missingData: collectMissingData(input),
    warnings,
    generatedAt: new Date().toISOString(),
  };
}
