import type { AnalysisResult, LeagueRules } from "@/lib/types";
import { buildMatchdayActions } from "@/lib/actionChecklist";
import { formatMoney } from "@/lib/format";

export function leagueRulesToPlainText(
  rules: LeagueRules,
  options?: { platformLabel?: string; leagueName?: string },
): string {
  const yesNo = (value: boolean) => (value ? "Sí" : "No");
  const lines: string[] = [
    "PUJAZO — Reglas de la liga",
    options?.leagueName?.trim()
      ? `Liga: ${options.leagueName.trim()}`
      : undefined,
    options?.platformLabel
      ? `Plataforma: ${options.platformLabel}`
      : undefined,
    "",
    "NÚMEROS",
    `Máximo de jugadores: ${rules.maxPlayers}`,
    `Dinero por punto: ${formatMoney(rules.moneyPerPoint)}`,
    `Premio MVP de partido: ${formatMoney(rules.matchMvpBonus)}`,
    `Premio MVP de jornada: ${formatMoney(rules.matchdayMvpBonus)}`,
    `Cambios durante la jornada: ${rules.matchdayChanges}`,
    `Multiplicador del capitán: ${rules.captainMultiplier}`,
    `Bonificación del ariete: ${rules.strikerBonus}`,
    `Bonificación máxima ariete/partido: ${rules.strikerMaxBonusPerMatch}`,
    `Máx. jornadas de cesión: ${rules.maxLoanMatchdays}`,
    "",
    "OPCIONES",
    `Capitán activado: ${yesNo(rules.captainEnabled)}`,
    `Capitán duplica también negativos: ${yesNo(rules.captainDoublesNegatives)}`,
    `Ariete activado: ${yesNo(rules.strikerEnabled)}`,
    `Jugadores multifunción: ${yesNo(rules.multifunctionalPlayers)}`,
    `Cláusulas activadas: ${yesNo(rules.clausesEnabled)}`,
    `Cláusulas irreversibles: ${yesNo(rules.clausesIrreversible)}`,
    `Cesiones permitidas: ${yesNo(rules.loansAllowed)}`,
    `Ventas entre participantes: ${yesNo(rules.salesBetweenParticipants)}`,
    `Venta solo si está en el mercado: ${yesNo(rules.saleOnlyWhenOnMarket)}`,
  ].filter((line): line is string => line !== undefined);

  if (rules.additionalRules.trim()) {
    lines.push("", "REGLAS ADICIONALES", rules.additionalRules.trim());
  }
  if (rules.privateNotes.trim()) {
    lines.push("", "NOTAS PRIVADAS", rules.privateNotes.trim());
  }

  lines.push(
    "",
    "— Generado con Pujazo (local). Ajusta lo que no coincida con tu comunidad.",
  );
  return lines.join("\n");
}

export function analysisToPlainText(result: AnalysisResult): string {
  const lines: string[] = [
    "PUJAZO — Análisis local",
    `Generado: ${result.generatedAt}`,
    "",
    "RESUMEN",
    result.summary,
    "",
    `Riesgo general: ${result.overallRisk}`,
    `¿Vender antes de fichar?: ${result.mustSellBeforeBuy ? "Sí" : "No"}`,
    `Saldo previsto: ${formatMoney(result.projectedBalance)}`,
  ];

  if (result.primaryTarget) {
    lines.push(
      "",
      "FICHAJE PRIORITARIO",
      `${result.primaryTarget.player.name} (${result.primaryTarget.player.position})`,
      `Puntuación local: ${result.primaryTarget.score}`,
      `Puja recomendada: ${formatMoney(result.primaryTarget.recommendedBid)}`,
      `Buena compra hasta: ${formatMoney(result.primaryTarget.goodBuyCeiling ?? result.primaryTarget.maxBid)}`,
      `Puja máxima: ${formatMoney(result.primaryTarget.maxBid)}`,
      ...result.primaryTarget.reasons.map((r) => `- ${r}`),
    );
  }

  if (result.alternativeTarget) {
    lines.push(
      "",
      "ALTERNATIVA",
      `${result.alternativeTarget.player.name}`,
      `Puja recomendada: ${formatMoney(result.alternativeTarget.recommendedBid)}`,
    );
  }

  if (result.marketRanking?.length) {
    lines.push("", "TOP FICHAJES");
    result.marketRanking.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.player.name} · score ${item.score} · puja ${formatMoney(item.recommendedBid)} · máx ${formatMoney(item.maxBid)} · riesgo ${item.risk}`,
      );
    });
  }

  if (result.sellRecommendations.length) {
    lines.push(
      "",
      "VENTAS RECOMENDADAS",
      ...result.sellRecommendations.map(
        (p) => `- ${p.name} (${formatMoney(p.value)})`,
      ),
    );
  }

  if (result.doNotSell.length) {
    lines.push(
      "",
      "NO VENDER",
      ...result.doNotSell.map((p) => `- ${p.name}`),
    );
  }

  if (result.lineup) {
    lines.push(
      "",
      `ALINEACIÓN (${result.lineup.formation})`,
      ...result.lineup.starters.map(
        (s) => `- ${s.position}: ${s.player.name}`,
      ),
    );
    if (result.lineup.captain) {
      lines.push(`Capitán: ${result.lineup.captain.name}`);
    }
    if (result.lineup.striker) {
      lines.push(`Ariete: ${result.lineup.striker.name}`);
    }
  }

  const actions = buildMatchdayActions(result);
  if (actions.length > 0) {
    lines.push(
      "",
      "ACCIONES DE LA JORNADA",
      ...actions.map((action) => `- [ ] ${action.label}`),
    );
  }

  lines.push("", "MOTIVOS", ...result.reasons.map((r) => `- ${r}`));
  lines.push(
    "",
    "PLAN ALTERNATIVO",
    ...result.alternativePlan.map((r) => `- ${r}`),
  );
  lines.push("", "DATOS QUE FALTAN", ...result.missingData.map((r) => `- ${r}`));
  lines.push("", "AVISOS", ...result.warnings.map((r) => `- ${r}`));
  lines.push(
    "",
    "Pujazo no utiliza datos deportivos en tiempo real ni está afiliado a plataformas fantasy.",
  );

  return lines.join("\n");
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function shareAnalysis(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  try {
    await navigator.share({
      title: "Análisis Pujazo",
      text,
    });
    return true;
  } catch {
    return false;
  }
}
