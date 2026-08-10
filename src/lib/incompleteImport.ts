import type {
  AnalysisType,
  MarketPlayer,
  PlayerStatus,
  Position,
  SquadPlayer,
} from "@/lib/types";

export type IncompleteIssueCode =
  | "missing_name"
  | "missing_squad_value"
  | "missing_market_value"
  | "status_all_disponible";

export type IncompleteImportIssue = {
  code: IncompleteIssueCode;
  severity: "block" | "warn";
  scope: "squad" | "market" | "global";
  playerName?: string;
  message: string;
};

type SquadLike = Pick<SquadPlayer, "name" | "value" | "status"> & {
  position?: Position;
};
type MarketLike = Pick<MarketPlayer, "name" | "marketValue" | "status"> & {
  position?: Position;
};

/**
 * Detecta huecos típicos tras pegar/share (sin precios, estados, etc.).
 */
export function incompleteImportIssues(input: {
  squad: SquadLike[];
  market: MarketLike[];
  analysisType?: AnalysisType;
}): IncompleteImportIssue[] {
  const issues: IncompleteImportIssue[] = [];
  const needsMarket =
    input.analysisType === "mercado" ||
    input.analysisType === "comparar" ||
    input.analysisType === "completo" ||
    input.analysisType === undefined;

  for (const player of input.squad) {
    if (!player.name.trim()) {
      issues.push({
        code: "missing_name",
        severity: "block",
        scope: "squad",
        message: "Hay un jugador de plantilla sin nombre.",
      });
    }
    if (!(Number(player.value) > 0)) {
      issues.push({
        code: "missing_squad_value",
        severity: "warn",
        scope: "squad",
        playerName: player.name || "Sin nombre",
        message: `${player.name || "Jugador"}: falta valor de mercado en plantilla.`,
      });
    }
  }

  for (const player of input.market) {
    if (!player.name.trim()) {
      issues.push({
        code: "missing_name",
        severity: "block",
        scope: "market",
        message: "Hay un candidato de mercado sin nombre.",
      });
    }
    if (!(Number(player.marketValue) > 0)) {
      issues.push({
        code: "missing_market_value",
        severity: needsMarket ? "block" : "warn",
        scope: "market",
        playerName: player.name || "Sin nombre",
        message: `${player.name || "Candidato"}: falta precio en el mercado.`,
      });
    }
  }

  if (
    input.squad.length >= 3 &&
    input.squad.every((p) => (p.status as PlayerStatus) === "disponible")
  ) {
    issues.push({
      code: "status_all_disponible",
      severity: "warn",
      scope: "global",
      message:
        "Toda la plantilla está como «disponible». Si hay lesionados o dudas, márcalos a mano.",
    });
  }

  return issues;
}

export function shouldBlockPlanGeneration(
  issues: IncompleteImportIssue[],
  analysisType: AnalysisType,
): boolean {
  const needsMarket =
    analysisType === "mercado" ||
    analysisType === "comparar" ||
    analysisType === "completo";

  return issues.some((issue) => {
    if (issue.severity !== "block") return false;
    if (issue.code === "missing_market_value") return needsMarket;
    return true;
  });
}

export function summarizeIncompleteIssues(
  issues: IncompleteImportIssue[],
): string {
  if (issues.length === 0) return "";
  const blocks = issues.filter((i) => i.severity === "block");
  const warns = issues.filter((i) => i.severity === "warn");
  const parts: string[] = [];
  if (blocks.length > 0) {
    parts.push(
      `${blocks.length} bloqueo(s): completa precios antes de generar un plan de fichajes.`,
    );
  }
  if (warns.length > 0) {
    parts.push(`${warns.length} aviso(s) a revisar.`);
  }
  return parts.join(" ");
}

/** Cuántos del mercado no tienen precio usable. */
export function countPricelessMarket(market: MarketLike[]): number {
  return market.filter((p) => !(Number(p.marketValue) > 0)).length;
}
