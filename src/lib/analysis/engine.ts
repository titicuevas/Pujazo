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
  if (
    input.squad.length >= 8 &&
    input.squad.every((p) => p.status === "disponible")
  ) {
    missing.push(
      "Toda la plantilla figura como disponible: si hay lesionados o dudas, márcalos a mano (el pegado de Biwenger casi nunca trae el icono de estado).",
    );
  }
  const marketWithoutBid = input.market.filter(
    (p) => p.estimatedBid == null && p.minPrice == null,
  );
  if (marketWithoutBid.length > 0) {
    missing.push(
      "Faltan pujas estimadas o precios mínimos en parte del mercado; se usa el valor de mercado.",
    );
  }
  const pricelessMarket = input.market.filter((p) => !(p.marketValue > 0));
  if (pricelessMarket.length > 0) {
    missing.push(
      `${pricelessMarket.length} candidato(s) del mercado sin precio: las pujas no son fiables hasta completarlos.`,
    );
  }
  const pricelessSquad = input.squad.filter((p) => !(p.value > 0));
  if (pricelessSquad.length > 0) {
    missing.push(
      `${pricelessSquad.length} jugador(es) de plantilla sin valor: las ventas recomendadas pueden ser imprecisas.`,
    );
  }
  return missing;
}

/** Huecos que conviene corregir antes de confiar en fichaje/once. */
export function actionableMissingData(missingData: string[]): string[] {
  const markers = [
    "Plantilla incompleta",
    "No hay jugadores en el mercado",
    "Falta al menos un portero",
    "sin precio",
    "sin valor",
  ];
  return missingData.filter((item) =>
    markers.some((marker) => item.toLowerCase().includes(marker.toLowerCase())),
  );
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
  if (input.analysisType === "comparar" && primary) {
    return `Comparativa de candidatos en ${platform} (estrategia ${strategy}). Encabeza el ranking ${primary.player.name}; revisa la tabla para contrastar pujas y encaje.`;
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

  const focusMarket =
    normalized.analysisType !== "alineacion" &&
    normalized.analysisType !== "ventas" &&
    normalized.analysisType !== "capitan";

  // Sin precio no debe ser el fichaje prioritario si hay alternativas con valor
  const pricedScored = scored.filter((s) => s.player.marketValue > 0);
  const focusPool = pricedScored.length > 0 ? pricedScored : scored;

  const primary = focusMarket ? focusPool[0] : undefined;
  const alternative = primary
    ? focusPool.find((s) => s.player.id !== primary.player.id)
    : undefined;
  const marketRanking =
    normalized.analysisType === "comparar"
      ? scored.slice(0, 5)
      : normalized.analysisType === "mercado" ||
          normalized.analysisType === "completo"
        ? scored.slice(0, 3)
        : undefined;

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

  if (normalized.analysisType === "comparar" && scored.length > 1) {
    reasons.push(
      `Ranking local de ${Math.min(scored.length, 5)} candidatos según tu estrategia ${strategyLabel(normalized.strategy)}.`,
    );
  } else if (
    (normalized.analysisType === "completo" ||
      normalized.analysisType === "mercado") &&
    scored.length > 1
  ) {
    reasons.push(
      `Top ${Math.min(scored.length, 3)} fichajes: ${scored
        .slice(0, 3)
        .map((s) => s.player.name)
        .join(", ")}.`,
    );
  }

  const alternativePlan: string[] = [];
  if (normalized.analysisType === "comparar" && scored.length > 1) {
    for (const [index, item] of scored.slice(0, 5).entries()) {
      alternativePlan.push(
        `${index + 1}. ${item.player.name}: score ${item.score}, puja ~${item.recommendedBid.toLocaleString("es-ES")} €, riesgo ${item.risk}.`,
      );
    }
  } else if (marketRanking && marketRanking.length > 1) {
    for (const [index, item] of marketRanking.entries()) {
      alternativePlan.push(
        `${index + 1}. ${item.player.name}: puja ~${item.recommendedBid.toLocaleString("es-ES")} € (máx. ${item.maxBid.toLocaleString("es-ES")} €).`,
      );
    }
  } else if (alternative) {
    alternativePlan.push(
      `Si pierdes a ${primary?.player.name}, intenta ${alternative.player.name} con puja ~${alternative.recommendedBid.toLocaleString("es-ES")} €.`,
    );
  }
  if (sellRecommendations.length > 0) {
    const sellSum = sellRecommendations.reduce((acc, p) => acc + p.value, 0);
    alternativePlan.push(
      `Ventas para cubrir el fichaje (hueco ~${fundsGap.toLocaleString("es-ES")} €): ${sellRecommendations.map((p) => `${p.name} (${p.value.toLocaleString("es-ES")} €)`).join(", ")} · suma ${sellSum.toLocaleString("es-ES")} €.`,
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
  const injuredStarters =
    lineup?.starters.filter(
      (slot) =>
        slot.player.status === "lesionado" ||
        slot.player.status === "sancionado",
    ) ?? [];
  if (injuredStarters.length > 0) {
    warnings.push(
      `En el once hay ${injuredStarters.length} jugador(es) lesionado(s)/sancionado(s) porque no había alternativa en esa posición.`,
    );
  }
  const injuredOnSquad = normalized.squad.filter(
    (p) => p.status === "lesionado" || p.status === "sancionado",
  );
  if (injuredOnSquad.length > 0) {
    warnings.push(
      `${injuredOnSquad.length} lesionado(s)/sancionado(s) en plantilla: priorizados para venta y evitados en el once si hay recambio.`,
    );
  }

  return {
    summary: buildSummary(normalized, primary, mustSell),
    primaryTarget: primary,
    alternativeTarget: alternative,
    marketRanking,
    recommendedBid: primary?.recommendedBid,
    goodBuyCeiling: primary?.goodBuyCeiling,
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
