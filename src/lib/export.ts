import type { AnalysisResult } from "@/lib/types";
import { formatMoney } from "@/lib/format";

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
