import {
  ANALYSIS_HISTORY_LIMIT,
  STORAGE_KEYS,
} from "@/lib/constants";
import type { AnalysisFormValues } from "@/lib/schemas";
import type { AnalysisResult, LeagueRules } from "@/lib/types";
import { createId } from "@/lib/format";

export type AnalysisHistoryEntry = {
  id: string;
  savedAt: string;
  title: string;
  result: AnalysisResult;
  input: AnalysisFormValues;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function saveFormDraft(values: AnalysisFormValues): void {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEYS.formDraft, JSON.stringify(values));
}

export function loadFormDraft(): AnalysisFormValues | null {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(STORAGE_KEYS.formDraft);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AnalysisFormValues;
  } catch {
    return null;
  }
}

export function clearAnalysisSnapshotCache(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new StorageEvent("storage", { key: STORAGE_KEYS.lastAnalysis }),
  );
}

function historyTitle(
  result: AnalysisResult,
  input: AnalysisFormValues,
): string {
  if (result.primaryTarget?.player.name) {
    return `${result.primaryTarget.player.name} · ${input.analysisType}`;
  }
  const short = result.summary.split(".")[0]?.trim();
  return short && short.length < 80 ? short : `Plan · ${input.analysisType}`;
}

function readHistory(): AnalysisHistoryEntry[] {
  if (!canUseStorage()) return [];
  const raw = localStorage.getItem(STORAGE_KEYS.analysisHistory);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as AnalysisHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: AnalysisHistoryEntry[]): void {
  if (!canUseStorage()) return;
  localStorage.setItem(
    STORAGE_KEYS.analysisHistory,
    JSON.stringify(entries.slice(0, ANALYSIS_HISTORY_LIMIT)),
  );
}

function pushHistory(
  result: AnalysisResult,
  input: AnalysisFormValues,
): void {
  const entry: AnalysisHistoryEntry = {
    id: createId("hist"),
    savedAt: result.generatedAt || new Date().toISOString(),
    title: historyTitle(result, input),
    result,
    input,
  };
  const next = [
    entry,
    ...readHistory().filter(
      (item) => item.result.generatedAt !== result.generatedAt,
    ),
  ];
  writeHistory(next);
}

export function saveLastAnalysis(
  result: AnalysisResult,
  input: AnalysisFormValues,
  options?: { archive?: boolean },
): void {
  if (!canUseStorage()) return;
  localStorage.setItem(
    STORAGE_KEYS.lastAnalysis,
    JSON.stringify({ result, input }),
  );
  if (options?.archive !== false) {
    pushHistory(result, input);
  }
  clearAnalysisSnapshotCache();
}

export function loadLastAnalysis(): {
  result: AnalysisResult;
  input: AnalysisFormValues;
} | null {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(STORAGE_KEYS.lastAnalysis);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      result: AnalysisResult;
      input: AnalysisFormValues;
    };
  } catch {
    return null;
  }
}

export function loadAnalysisHistory(): AnalysisHistoryEntry[] {
  return readHistory();
}

export function loadHistoryEntry(id: string): AnalysisHistoryEntry | null {
  return readHistory().find((entry) => entry.id === id) ?? null;
}

export function restoreHistoryEntry(id: string): boolean {
  const entry = loadHistoryEntry(id);
  if (!entry) return false;
  saveLastAnalysis(entry.result, entry.input, { archive: false });
  return true;
}

export function deleteHistoryEntry(id: string): void {
  writeHistory(readHistory().filter((entry) => entry.id !== id));
}

export function clearAnalysisHistory(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(STORAGE_KEYS.analysisHistory);
}

export function saveCustomRules(rules: LeagueRules): void {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEYS.customRules, JSON.stringify(rules));
}

export function loadCustomRules(): LeagueRules | null {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(STORAGE_KEYS.customRules);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LeagueRules;
  } catch {
    return null;
  }
}

export function clearAllLocalData(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(STORAGE_KEYS.formDraft);
  localStorage.removeItem(STORAGE_KEYS.lastAnalysis);
  localStorage.removeItem(STORAGE_KEYS.customRules);
  localStorage.removeItem(STORAGE_KEYS.analysisHistory);
  clearAnalysisSnapshotCache();
}
