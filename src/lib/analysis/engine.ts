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
import { analysisTypeLabel, positionLabel, strategyLabel } from "@/lib/labels";
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
    missing.push(
      `Pueden faltar ${positionLabel(need).toLowerCase()}s según una distribución habitual.`,
    );
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
  const strategy = strategyLabel(input.strategy);

  if (input.analysisType === "alineacion") {
    return `Análisis de alineación para ${platform} (estrategia ${strategy}). El once se elige solo con los datos que has introducido.`;
  }
  if (input.analysisType === "ventas") {
    return `Revisión de ventas para liberar cupo o saldo en ${platform}.`;
  }
  if (primary) {
    return mustSell
      ? `Para fichar a ${primary.player.name} en ${platform} necesitas vender antes y pujar con margen según tu estrategia ${strategy}.`
      : `Fichaje prioritario sugerido: ${primary.player.name}. Plan orientado a estrategia ${strategy} en ${platform}.`;
  }
  return `Revisión de tipo «${analysisTypeLabel(input.analysisType)}» para ${platform}. Revisa ventas, cupo y datos faltantes.`;
}

export function analyzeTeam(input: AnalysisInput): AnalysisResult {
  const maxPlayers = input.rules.maxPlayers || input.maxPlayers;
  const normalized: AnalysisInput = {
    ...input,
    maxPlayers,
    rules: {
      ...input.rules,
      maxPlayers,
    },
  };

  const scored = normalized.market
    .map((player) => scoreMarketPlayer(player, normalized))
    .sort((a, b) => b.score - a.score);

  const primary =
    normalized.analysisType === "alineacion" ||
    normalized.analysisType === "ventas"
      ? undefined
      : scored[0];
  const alternative = primary ? scored[1] : undefined;

  const buyCost = primary?.recommendedBid ?? 0;
  const slotsNeeded = normalized.squad.length >= maxPlayers ? 1 : 0;
  const fundsGap = Math.max(0, buyCost - normalized.balance);
  const mustSell = primary
    ? mustSellBeforeBuying({
        squadSize: normalized.squad.length,
        maxPlayers,
        balance: normalized.balance,
        buyCost,
        allowNegativeBalance: normalized.allowNegativeBalance,
      })
    : normalized.squad.length > maxPlayers;

  const sellRecommendations =
    normalized.analysisType === "alineacion" ||
    normalized.analysisType === "capitan"
      ? []
      : pickSellCandidates(
          normalized.squad,
          fundsGap,
          slotsNeeded || (mustSell ? 1 : 0),
        );

  const doNotSell = normalized.squad.filter((p) => p.doNotSell);
  const projected = projectedBalanceAfter(
    normalized.balance,
    sellRecommendations.map((p) => p.value),
    buyCost,
  );

  const includeLineup =
    normalized.analysisType === "alineacion" ||
    normalized.analysisType === "capitan" ||
    normalized.analysisType === "completo";

  const lineup = includeLineup
    ? buildLineup(normalized.squad, normalized.rules) ?? undefined
    : undefined;

  const reasons: string[] = [];
  const counts = countByPosition(normalized.squad);
  reasons.push(
    `Plantilla: ${normalized.squad.length}/${maxPlayers} (POR ${counts.portero}, DEF ${counts.defensa}, CEN ${counts.centrocampista}, DEL ${counts.delantero}).`,
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
  for (const excess of excessPositions(normalized.squad)) {
    reasons.push(
      `Hay exceso de ${positionLabel(excess).toLowerCase()}s; prioriza ventas en esa posición.`,
    );
  }
  if (normalized.rules.saleOnlyWhenOnMarket) {
    reasons.push(
      "Según tus reglas, las ventas entre participantes solo aplican si el jugador está en el mercado.",
    );
  }
  if (!normalized.rules.captainEnabled) {
    reasons.push("La regla de capitán está desactivada en esta liga.");
  }
  if (!normalized.rules.strikerEnabled) {
    reasons.push("La regla de ariete está desactivada en esta liga.");
  }
  if (normalized.concreteDoubt?.trim()) {
    reasons.push(`Duda del usuario: ${normalized.concreteDoubt.trim()}`);
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
  if (!primary && normalized.market.length === 0) {
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
  if (normalized.squad.length > maxPlayers) {
    warnings.push(
      `Has superado el máximo permitido (${maxPlayers}). Debes vender.`,
    );
  }
  if (lineup == null && includeLineup) {
    warnings.push(
      "No se pudo generar un once válido con las posiciones disponibles.",
    );
  }
  if (sellRecommendations.some((p) => p.doNotSell)) {
    warnings.push(
      "Se detectó un conflicto: un jugador marcado como «no vender» apareció en ventas.",
    );
  }

  return {
    summary: buildSummary(normalized, primary, mustSell),
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
    missingData: collectMissingData(normalized),
    warnings,
    generatedAt: new Date().toISOString(),
  };
}
