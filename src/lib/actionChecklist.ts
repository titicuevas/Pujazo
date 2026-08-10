import { STORAGE_KEYS } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import type { AnalysisResult } from "@/lib/types";
import { z } from "zod";

export type MatchdayAction = {
  id: string;
  label: string;
};

const checklistStoreSchema = z.record(z.string(), z.array(z.string()));

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/** Acciones concretas derivadas del plan (para marcar en la app fantasy). */
export function buildMatchdayActions(result: AnalysisResult): MatchdayAction[] {
  const actions: MatchdayAction[] = [];

  if (result.mustSellBeforeBuy) {
    actions.push({
      id: "sell-before-buy",
      label: "Vender antes de fichar (cupo o saldo)",
    });
  }

  for (const player of result.sellRecommendations.slice(0, 4)) {
    actions.push({
      id: `sell:${player.id}`,
      label: `Vender ${player.name} (${formatMoney(player.value)})`,
    });
  }

  if (result.primaryTarget) {
    const bid = result.recommendedBid ?? result.primaryTarget.recommendedBid;
    const max = result.maxBid ?? result.primaryTarget.maxBid;
    actions.push({
      id: `bid:${result.primaryTarget.player.id}`,
      label: `Pujar por ${result.primaryTarget.player.name}: ${formatMoney(bid)} (máx. ${formatMoney(max)})`,
    });
  }

  if (result.lineup?.formation) {
    actions.push({
      id: `lineup:${result.lineup.formation}`,
      label: `Guardar alineación ${result.lineup.formation}`,
    });
  }
  if (result.lineup?.captain) {
    actions.push({
      id: `captain:${result.lineup.captain.id}`,
      label: `Capitán: ${result.lineup.captain.name}`,
    });
  }
  if (result.lineup?.striker) {
    actions.push({
      id: `striker:${result.lineup.striker.id}`,
      label: `Ariete: ${result.lineup.striker.name}`,
    });
  }

  return actions;
}

function readStore(): Record<string, string[]> {
  if (!canUseStorage()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.actionChecklist);
    if (!raw) return {};
    const parsed = checklistStoreSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, string[]>): void {
  if (!canUseStorage()) return;
  try {
    // Limitar a los 10 análisis más recientes (por clave ISO)
    const keys = Object.keys(store).sort().reverse().slice(0, 10);
    const trimmed: Record<string, string[]> = {};
    for (const key of keys) trimmed[key] = store[key] ?? [];
    localStorage.setItem(STORAGE_KEYS.actionChecklist, JSON.stringify(trimmed));
  } catch {
    // quota
  }
}

export function loadMatchdayChecklist(analysisId: string): Set<string> {
  const done = readStore()[analysisId] ?? [];
  return new Set(done);
}

export function saveMatchdayChecklist(
  analysisId: string,
  doneIds: Set<string>,
): void {
  const store = readStore();
  store[analysisId] = [...doneIds];
  writeStore(store);
}

export function toggleMatchdayAction(
  analysisId: string,
  actionId: string,
): Set<string> {
  const current = loadMatchdayChecklist(analysisId);
  if (current.has(actionId)) current.delete(actionId);
  else current.add(actionId);
  saveMatchdayChecklist(analysisId, current);
  return current;
}

export function clearMatchdayChecklist(analysisId: string): void {
  const store = readStore();
  delete store[analysisId];
  writeStore(store);
}

export function matchdayChecklistProgress(
  result: AnalysisResult,
): { done: number; total: number } | null {
  const actions = buildMatchdayActions(result);
  if (actions.length === 0) return null;
  const done = loadMatchdayChecklist(result.generatedAt);
  const count = actions.filter((a) => done.has(a.id)).length;
  return { done: count, total: actions.length };
}
