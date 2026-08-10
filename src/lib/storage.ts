import {
  ANALYSIS_HISTORY_LIMIT,
  STORAGE_KEYS,
} from "@/lib/constants";
import {
  analysisHistoryEntrySchema,
  formDraftSchema,
  leagueRulesSchema,
  storedAnalysisSnapshotSchema,
  type AnalysisFormValues,
} from "@/lib/schemas";
import type { AnalysisResult, LeagueRules } from "@/lib/types";
import { createId } from "@/lib/format";
import { z } from "zod";

export type AnalysisHistoryEntry = {
  id: string;
  savedAt: string;
  title: string;
  result: AnalysisResult;
  input: AnalysisFormValues;
};

export type StorageWriteResult =
  | { ok: true }
  | { ok: false; reason: "quota" | "unavailable" };

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22)
  );
}

function setItemSafe(key: string, value: string): StorageWriteResult {
  if (!canUseStorage()) return { ok: false, reason: "unavailable" };
  try {
    localStorage.setItem(key, value);
    return { ok: true };
  } catch (error) {
    if (isQuotaError(error)) return { ok: false, reason: "quota" };
    return { ok: false, reason: "unavailable" };
  }
}

function parseStored<T>(
  raw: string | null,
  schema: z.ZodType<T>,
  removeKey?: string,
): T | null {
  if (!raw) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    // JSON inválido
  }
  if (removeKey && canUseStorage()) {
    localStorage.removeItem(removeKey);
  }
  return null;
}

export function storageWriteMessage(result: StorageWriteResult): string | null {
  if (result.ok) return null;
  if (result.reason === "quota") {
    return "No hay espacio suficiente en este dispositivo. Borra el historial o descarga el plan y vuelve a intentar.";
  }
  return "No se pudo guardar en este dispositivo.";
}

export function saveFormDraft(values: AnalysisFormValues): StorageWriteResult {
  const checked = formDraftSchema.safeParse(values);
  if (!checked.success) return { ok: false, reason: "unavailable" };
  return setItemSafe(STORAGE_KEYS.formDraft, JSON.stringify(checked.data));
}

export function loadFormDraft(): AnalysisFormValues | null {
  if (!canUseStorage()) return null;
  return parseStored(
    localStorage.getItem(STORAGE_KEYS.formDraft),
    formDraftSchema,
    STORAGE_KEYS.formDraft,
  );
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
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(STORAGE_KEYS.analysisHistory);
      return [];
    }
    const entries: AnalysisHistoryEntry[] = [];
    for (const item of parsed) {
      const checked = analysisHistoryEntrySchema.safeParse(item);
      if (checked.success) entries.push(checked.data);
    }
    if (entries.length !== parsed.length) {
      // Limpia entradas corruptas persistiendo solo las válidas
      void writeHistory(entries);
    }
    return entries;
  } catch {
    localStorage.removeItem(STORAGE_KEYS.analysisHistory);
    return [];
  }
}

function writeHistory(entries: AnalysisHistoryEntry[]): StorageWriteResult {
  const trimmed = entries.slice(0, ANALYSIS_HISTORY_LIMIT);
  let payload = JSON.stringify(trimmed);
  let result = setItemSafe(STORAGE_KEYS.analysisHistory, payload);
  if (result.ok || result.reason !== "quota") return result;

  // Liberar espacio: ir reduciendo historial
  for (let size = Math.max(1, Math.floor(trimmed.length / 2)); size >= 1; size = Math.floor(size / 2)) {
    payload = JSON.stringify(trimmed.slice(0, size));
    result = setItemSafe(STORAGE_KEYS.analysisHistory, payload);
    if (result.ok) return result;
    if (size === 1) break;
  }
  localStorage.removeItem(STORAGE_KEYS.analysisHistory);
  return { ok: false, reason: "quota" };
}

function pushHistory(
  result: AnalysisResult,
  input: AnalysisFormValues,
): StorageWriteResult {
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
  return writeHistory(next);
}

export function saveLastAnalysis(
  result: AnalysisResult,
  input: AnalysisFormValues,
  options?: { archive?: boolean },
): StorageWriteResult {
  if (!canUseStorage()) return { ok: false, reason: "unavailable" };

  const snapshot = storedAnalysisSnapshotSchema.safeParse({ result, input });
  if (!snapshot.success) return { ok: false, reason: "unavailable" };

  let write = setItemSafe(
    STORAGE_KEYS.lastAnalysis,
    JSON.stringify(snapshot.data),
  );
  if (!write.ok && write.reason === "quota") {
    localStorage.removeItem(STORAGE_KEYS.analysisHistory);
    write = setItemSafe(
      STORAGE_KEYS.lastAnalysis,
      JSON.stringify(snapshot.data),
    );
  }
  if (!write.ok) return write;

  if (options?.archive !== false) {
    const archived = pushHistory(result, input);
    if (!archived.ok && archived.reason === "quota") {
      // El plan actual sí quedó; avisar vía resultado de archive fallido
      clearAnalysisSnapshotCache();
      return archived;
    }
  }
  clearAnalysisSnapshotCache();
  return { ok: true };
}

export function loadLastAnalysis(): {
  result: AnalysisResult;
  input: AnalysisFormValues;
} | null {
  if (!canUseStorage()) return null;
  return parseStored(
    localStorage.getItem(STORAGE_KEYS.lastAnalysis),
    storedAnalysisSnapshotSchema,
    STORAGE_KEYS.lastAnalysis,
  );
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
  return saveLastAnalysis(entry.result, entry.input, { archive: false }).ok;
}

/** Carga el input de un plan del historial como borrador editable del asistente. */
export function restoreHistoryEntryToDraft(id: string): StorageWriteResult {
  const entry = loadHistoryEntry(id);
  if (!entry) return { ok: false, reason: "unavailable" };
  const draftWrite = saveFormDraft(entry.input);
  if (!draftWrite.ok) return draftWrite;
  const rulesWrite = saveCustomRules(entry.input.rules);
  if (!rulesWrite.ok) return rulesWrite;
  return { ok: true };
}

export function deleteHistoryEntry(id: string): void {
  void writeHistory(readHistory().filter((entry) => entry.id !== id));
}

export function clearAnalysisHistory(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(STORAGE_KEYS.analysisHistory);
}

export function saveCustomRules(rules: LeagueRules): StorageWriteResult {
  const checked = leagueRulesSchema.safeParse(rules);
  if (!checked.success) return { ok: false, reason: "unavailable" };
  return setItemSafe(STORAGE_KEYS.customRules, JSON.stringify(checked.data));
}

export function loadCustomRules(): LeagueRules | null {
  if (!canUseStorage()) return null;
  return parseStored(
    localStorage.getItem(STORAGE_KEYS.customRules),
    leagueRulesSchema,
    STORAGE_KEYS.customRules,
  );
}

export function clearAllLocalData(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(STORAGE_KEYS.formDraft);
  localStorage.removeItem(STORAGE_KEYS.lastAnalysis);
  localStorage.removeItem(STORAGE_KEYS.customRules);
  localStorage.removeItem(STORAGE_KEYS.analysisHistory);
  clearAnalysisSnapshotCache();
}

const localBackupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  draft: formDraftSchema.nullable().optional(),
  customRules: leagueRulesSchema.nullable().optional(),
  lastAnalysis: storedAnalysisSnapshotSchema.nullable().optional(),
  history: z.array(analysisHistoryEntrySchema).optional(),
});

export type LocalBackup = z.infer<typeof localBackupSchema>;

/** Snapshot de todo lo guardado en este dispositivo (sin subir a ningún sitio). */
export function exportLocalBackup(): LocalBackup | null {
  if (!canUseStorage()) return null;
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    draft: loadFormDraft(),
    customRules: loadCustomRules(),
    lastAnalysis: loadLastAnalysis(),
    history: loadAnalysisHistory(),
  };
}

export type ImportBackupResult =
  | { ok: true; historyCount: number }
  | { ok: false; reason: "invalid" | "quota" | "unavailable" };

/**
 * Restaura un JSON exportado. Sustituye borrador, reglas, último plan e historial.
 */
export function importLocalBackup(raw: unknown): ImportBackupResult {
  if (!canUseStorage()) return { ok: false, reason: "unavailable" };

  const checked = localBackupSchema.safeParse(raw);
  if (!checked.success) return { ok: false, reason: "invalid" };
  const data = checked.data;

  if (data.draft) {
    const w = saveFormDraft(data.draft);
    if (!w.ok) return { ok: false, reason: w.reason };
  }
  if (data.customRules) {
    const w = saveCustomRules(data.customRules);
    if (!w.ok) return { ok: false, reason: w.reason };
  }
  if (data.lastAnalysis) {
    const w = saveLastAnalysis(data.lastAnalysis.result, data.lastAnalysis.input, {
      archive: false,
    });
    if (!w.ok) return { ok: false, reason: w.reason };
  }
  if (data.history) {
    const w = writeHistory(data.history);
    if (!w.ok) return { ok: false, reason: w.reason };
  }

  clearAnalysisSnapshotCache();
  return { ok: true, historyCount: data.history?.length ?? 0 };
}
