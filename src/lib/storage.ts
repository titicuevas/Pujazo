import { STORAGE_KEYS } from "@/lib/constants";
import type { AnalysisFormValues } from "@/lib/schemas";
import type { AnalysisResult, LeagueRules } from "@/lib/types";

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
  // Used by resultado page module cache via storage event fallback.
  window.dispatchEvent(
    new StorageEvent("storage", { key: STORAGE_KEYS.lastAnalysis }),
  );
}

export function saveLastAnalysis(
  result: AnalysisResult,
  input: AnalysisFormValues,
): void {
  if (!canUseStorage()) return;
  localStorage.setItem(
    STORAGE_KEYS.lastAnalysis,
    JSON.stringify({ result, input }),
  );
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
  clearAnalysisSnapshotCache();
}
