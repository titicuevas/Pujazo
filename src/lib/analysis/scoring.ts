import { STATUS_PENALTY } from "@/lib/constants";
import { positionLabel, statusLabel } from "@/lib/labels";
import type {
  AnalysisInput,
  MarketPlayer,
  Position,
  RiskLevel,
  ScoredMarketPlayer,
  SquadPlayer,
  Strategy,
} from "@/lib/types";

export function countByPosition(
  players: Array<{ position: Position; extraPositions?: Position[] }>,
): Record<Position, number> {
  const counts: Record<Position, number> = {
    portero: 0,
    defensa: 0,
    centrocampista: 0,
    delantero: 0,
  };
  for (const player of players) {
    counts[player.position] += 1;
  }
  return counts;
}

export function squadNeeds(squad: SquadPlayer[]): Position[] {
  const counts = countByPosition(squad);
  const needs: Position[] = [];
  if (counts.portero < 1) needs.push("portero");
  if (counts.defensa < 3) needs.push("defensa");
  if (counts.centrocampista < 3) needs.push("centrocampista");
  if (counts.delantero < 2) needs.push("delantero");
  return needs;
}

export function excessPositions(squad: SquadPlayer[]): Position[] {
  const counts = countByPosition(squad);
  const excess: Position[] = [];
  if (counts.portero > 3) excess.push("portero");
  if (counts.defensa > 8) excess.push("defensa");
  if (counts.centrocampista > 8) excess.push("centrocampista");
  if (counts.delantero > 6) excess.push("delantero");
  return excess;
}

function strategyWeight(strategy: Strategy): {
  price: number;
  fit: number;
  starter: number;
  status: number;
  aggression: number;
} {
  switch (strategy) {
    case "seguro":
      return { price: 1.4, fit: 1.1, starter: 1.5, status: 1.6, aggression: 0.4 };
    case "equilibrado":
      return { price: 1, fit: 1.2, starter: 1.2, status: 1.2, aggression: 1 };
    case "agresivo":
      return { price: 0.6, fit: 1, starter: 1.3, status: 0.8, aggression: 1.6 };
    case "especulacion":
      return { price: 1.6, fit: 0.9, starter: 0.8, status: 0.9, aggression: 1.3 };
  }
}

export function estimateBid(
  player: MarketPlayer,
  balance: number,
  strategy: Strategy,
): { recommended: number; max: number } {
  const floor = player.minPrice ?? player.marketValue;
  const hint = player.estimatedBid ?? Math.round(player.marketValue * 1.08);
  const base = Math.max(floor, hint);

  const strategyFactor: Record<Strategy, number> = {
    seguro: 0.98,
    equilibrado: 1.05,
    agresivo: 1.15,
    especulacion: 1.02,
  };

  const recommended = Math.round(base * strategyFactor[strategy]);
  const marginReserve =
    strategy === "seguro" ? 0.25 : strategy === "equilibrado" ? 0.15 : 0.05;
  const affordableMax = Math.max(
    0,
    Math.floor(balance * (1 - marginReserve)),
  );
  const maxFromValue = Math.round(player.marketValue * 1.35);
  const max = Math.max(
    recommended,
    Math.min(affordableMax || recommended, Math.max(maxFromValue, recommended)),
  );

  return {
    recommended: Math.min(recommended, max || recommended),
    max,
  };
}

export function scoreMarketPlayer(
  player: MarketPlayer,
  input: AnalysisInput,
): ScoredMarketPlayer {
  const weights = strategyWeight(input.strategy);
  const needs = squadNeeds(input.squad);
  const excess = excessPositions(input.squad);
  const reasons: string[] = [];
  let score = 50;

  if (needs.includes(player.position)) {
    score += 22 * weights.fit;
    reasons.push(
      `Encaja en una posición necesaria (${positionLabel(player.position)}).`,
    );
  } else if (excess.includes(player.position)) {
    score -= 14 * weights.fit;
    reasons.push(
      `Ya hay exceso de ${positionLabel(player.position).toLowerCase()}s en la plantilla.`,
    );
  } else {
    score += 4 * weights.fit;
    reasons.push("La posición es usable, aunque no es la más urgente.");
  }

  const bids = estimateBid(player, input.balance, input.strategy);
  const priceRatio =
    input.balance > 0 ? bids.recommended / input.balance : 1.5;

  if (priceRatio <= 0.35) {
    score += 16 * weights.price;
    reasons.push("El precio deja buen margen de saldo.");
  } else if (priceRatio <= 0.6) {
    score += 8 * weights.price;
    reasons.push("El precio es razonable respecto al saldo.");
  } else if (priceRatio <= 0.85) {
    score -= 4 * weights.price;
    reasons.push("El fichaje consumiría gran parte del saldo.");
  } else {
    score -= 18 * weights.price;
    reasons.push("El coste es alto frente al saldo disponible.");
  }

  if (player.possibleStarter) {
    score += 14 * weights.starter;
    reasons.push("Marcado como posible titular.");
  }

  const penalty = STATUS_PENALTY[player.status] * weights.status;
  score -= penalty;
  if (player.status !== "disponible") {
    reasons.push(`Estado: ${statusLabel(player.status)} (penaliza).`);
  }

  if (input.strategy === "agresivo" && player.marketValue >= 8_000_000) {
    score += 10 * weights.aggression;
    reasons.push("Perfil de impacto acorde a estrategia agresiva.");
  }
  if (input.strategy === "especulacion" && priceRatio <= 0.4) {
    score += 12 * weights.aggression;
    reasons.push("Buen candidato de especulación por valor relativo.");
  }
  if (input.strategy === "seguro" && player.status === "disponible") {
    score += 6;
  }

  if (bids.recommended > input.balance && !input.allowNegativeBalance) {
    score -= 25;
    reasons.push("No hay saldo suficiente sin vender antes.");
  }

  const risk: RiskLevel =
    score >= 70 && player.status === "disponible"
      ? "bajo"
      : score >= 45
        ? "medio"
        : "alto";

  return {
    player,
    score: Math.round(score),
    reasons,
    risk,
    recommendedBid: bids.recommended,
    maxBid: bids.max,
  };
}

export function projectedBalanceAfter(
  balance: number,
  sellValues: number[],
  buyCost: number,
): number {
  const income = sellValues.reduce((acc, v) => acc + v, 0);
  return balance + income - buyCost;
}

export function mustSellBeforeBuying(input: {
  squadSize: number;
  maxPlayers: number;
  balance: number;
  buyCost: number;
  allowNegativeBalance: boolean;
}): boolean {
  const overRoster = input.squadSize >= input.maxPlayers;
  const insufficientFunds =
    !input.allowNegativeBalance && input.buyCost > input.balance;
  return overRoster || insufficientFunds;
}

export function pickSellCandidates(
  squad: SquadPlayer[],
  neededValue: number,
  neededSlots: number,
): SquadPlayer[] {
  const sellable = squad
    .filter((p) => !p.doNotSell)
    .map((p) => ({
      player: p,
      rank:
        (p.usualStarter ? -20 : 10) +
        STATUS_PENALTY[p.status] +
        (p.value / 1_000_000) * 0.5,
    }))
    .sort((a, b) => b.rank - a.rank)
    .map((x) => x.player);

  const picked: SquadPlayer[] = [];
  let value = 0;
  for (const player of sellable) {
    if (picked.length >= Math.max(neededSlots, 1) && value >= neededValue) {
      break;
    }
    if (picked.length >= Math.max(neededSlots, 3) && value >= neededValue) {
      break;
    }
    picked.push(player);
    value += player.value;
    if (picked.length >= 4) break;
  }

  if (neededSlots > 0 && picked.length === 0 && sellable[0]) {
    picked.push(sellable[0]);
  }

  return picked;
}

export function overallRiskFromScores(
  scores: ScoredMarketPlayer[],
  mustSell: boolean,
  projected: number,
): RiskLevel {
  const top = scores[0];
  if (!top) return mustSell ? "medio" : "bajo";
  if (top.risk === "alto" || projected < 0) return "alto";
  if (mustSell || top.risk === "medio" || projected < 500_000) return "medio";
  return "bajo";
}
