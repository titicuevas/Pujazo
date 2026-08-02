import { FORMATION_SHAPES, STATUS_PENALTY } from "@/lib/constants";
import type {
  Formation,
  LeagueRules,
  LineupResult,
  LineupSlot,
  Position,
  SquadPlayer,
} from "@/lib/types";

function playerFitness(player: SquadPlayer, position: Position): number {
  const canPlay =
    player.position === position ||
    player.extraPositions.includes(position);
  if (!canPlay) return -Infinity;

  let score = 40;
  if (player.position === position) score += 20;
  if (player.usualStarter) score += 18;
  score -= STATUS_PENALTY[player.status];
  if (player.status === "lesionado" || player.status === "sancionado") {
    score -= 10;
  }
  // Prefer higher value as a weak proxy when no sports data exists
  score += Math.min(12, player.value / 2_000_000);
  return score;
}

function tryFormation(
  formation: Formation,
  squad: SquadPlayer[],
  multifunctional: boolean,
): LineupResult | null {
  const shape = FORMATION_SHAPES[formation];
  const remaining = [...squad];
  const starters: LineupSlot[] = [];

  const place = (position: Position, count: number): boolean => {
    for (let i = 0; i < count; i += 1) {
      let bestIndex = -1;
      let bestScore = -Infinity;
      remaining.forEach((player, index) => {
        const extras = multifunctional ? player.extraPositions : [];
        const effective: SquadPlayer = {
          ...player,
          extraPositions: extras,
        };
        const score = playerFitness(effective, position);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      });
      if (bestIndex < 0 || !Number.isFinite(bestScore)) return false;
      const [chosen] = remaining.splice(bestIndex, 1);
      starters.push({ position, player: chosen });
    }
    return true;
  };

  if (!place("portero", 1)) return null;
  if (!place("defensa", shape.defensa)) return null;
  if (!place("centrocampista", shape.centrocampista)) return null;
  if (!place("delantero", shape.delantero)) return null;

  return {
    formation,
    starters,
    bench: remaining,
    reasons: [
      `Formación ${formation} viable con los jugadores introducidos.`,
      "La selección se basa solo en posición, estado, titularidad habitual y valor indicado.",
    ],
  };
}

export function selectValidFormation(
  squad: SquadPlayer[],
  multifunctionalPlayers = true,
): LineupResult | null {
  if (squad.length < 11) return null;

  const preference: Formation[] = [
    "4-3-3",
    "4-4-2",
    "3-5-2",
    "3-4-3",
    "5-3-2",
  ];

  const candidates = preference
    .map((formation) => tryFormation(formation, squad, multifunctionalPlayers))
    .filter((x): x is LineupResult => Boolean(x));

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => lineupQuality(b) - lineupQuality(a));
  return candidates[0];
}

function lineupQuality(lineup: LineupResult): number {
  return lineup.starters.reduce((acc, slot) => {
    return acc + playerFitness(slot.player, slot.position);
  }, 0);
}

export function pickCaptain(
  lineup: LineupResult,
  rules: LeagueRules,
): SquadPlayer | undefined {
  if (!rules.captainEnabled) return undefined;
  const outfield = lineup.starters
    .filter((s) => s.position !== "portero")
    .map((s) => s.player)
    .filter((p) => p.status === "disponible" || p.status === "duda");

  if (outfield.length === 0) return undefined;

  return [...outfield].sort((a, b) => {
    const score = (p: SquadPlayer) =>
      (p.usualStarter ? 20 : 0) -
      STATUS_PENALTY[p.status] +
      p.value / 1_000_000;
    return score(b) - score(a);
  })[0];
}

export function pickStriker(
  lineup: LineupResult,
  rules: LeagueRules,
): SquadPlayer | undefined {
  if (!rules.strikerEnabled) return undefined;
  const forwards = lineup.starters
    .filter((s) => s.position === "delantero")
    .map((s) => s.player)
    .filter((p) => p.status !== "lesionado" && p.status !== "sancionado");

  if (forwards.length === 0) return undefined;

  return [...forwards].sort((a, b) => {
    const score = (p: SquadPlayer) =>
      (p.usualStarter ? 15 : 0) - STATUS_PENALTY[p.status] + p.value / 1_500_000;
    return score(b) - score(a);
  })[0];
}

export function buildLineup(
  squad: SquadPlayer[],
  rules: LeagueRules,
): LineupResult | null {
  const base = selectValidFormation(squad, rules.multifunctionalPlayers);
  if (!base) return null;

  const captain = pickCaptain(base, rules);
  const striker = pickStriker(base, rules);
  const reasons = [...base.reasons];

  if (captain) {
    reasons.push(
      `Capitán sugerido: ${captain.name} (x${rules.captainMultiplier}${
        rules.captainDoublesNegatives
          ? ", también en puntos negativos"
          : ""
      }).`,
    );
  }
  if (striker) {
    reasons.push(
      `Ariete sugerido: ${striker.name} (+${rules.strikerBonus} pts, tope ${rules.strikerMaxBonusPerMatch} por partido).`,
    );
  }

  return {
    ...base,
    captain,
    striker,
    reasons,
  };
}

/** Aplica multiplicador de capitán a puntos (positivos y/o negativos). */
export function applyCaptainPoints(
  points: number,
  multiplier: number,
  doublesNegatives: boolean,
): number {
  if (points >= 0) return points * multiplier;
  return doublesNegatives ? points * multiplier : points;
}

/** Bonificación de ariete con tope por partido. */
export function applyStrikerBonus(
  goals: number,
  bonusPerGoal: number,
  maxBonus: number,
): number {
  if (goals <= 0) return 0;
  return Math.min(goals * bonusPerGoal, maxBonus);
}
