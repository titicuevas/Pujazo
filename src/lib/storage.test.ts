import { beforeEach, describe, expect, it } from "vitest";
import { createDemoFormValues } from "@/lib/demo";
import { ANALYSIS_HISTORY_LIMIT } from "@/lib/constants";
import type { AnalysisResult } from "@/lib/types";
import {
  clearAnalysisHistory,
  clearAllLocalData,
  deleteHistoryEntry,
  loadAnalysisHistory,
  loadFormDraft,
  loadLastAnalysis,
  restoreHistoryEntry,
  saveLastAnalysis,
} from "@/lib/storage";

function makeResult(overrides?: Partial<AnalysisResult>): AnalysisResult {
  return {
    summary: "Plan de prueba para la jornada.",
    sellRecommendations: [],
    doNotSell: [],
    projectedBalance: 1_000_000,
    mustSellBeforeBuy: false,
    overallRisk: "medio",
    reasons: ["Razón A"],
    alternativePlan: [],
    missingData: [],
    warnings: [],
    generatedAt: overrides?.generatedAt ?? "2026-08-02T10:00:00.000Z",
    ...overrides,
  };
}

describe("historial de análisis (storage)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("archiva al guardar el último análisis", () => {
    const input = createDemoFormValues();
    const result = makeResult();
    saveLastAnalysis(result, input);

    expect(loadLastAnalysis()?.result.summary).toBe(result.summary);
    const history = loadAnalysisHistory();
    expect(history).toHaveLength(1);
    expect(history[0].title).toMatch(/Plan de prueba|completo/);
    expect(history[0].result.summary).toBe(result.summary);
  });

  it("no duplica entradas con el mismo generatedAt", () => {
    const input = createDemoFormValues();
    const result = makeResult({ generatedAt: "2026-08-02T11:00:00.000Z" });
    saveLastAnalysis(result, input);
    saveLastAnalysis(result, input);
    expect(loadAnalysisHistory()).toHaveLength(1);
  });

  it("respeta el límite de entradas", () => {
    const input = createDemoFormValues();
    for (let i = 0; i < ANALYSIS_HISTORY_LIMIT + 5; i += 1) {
      saveLastAnalysis(
        makeResult({
          generatedAt: `2026-08-02T${String(i).padStart(2, "0")}:00:00.000Z`,
          summary: `Plan ${i}`,
        }),
        input,
      );
    }
    expect(loadAnalysisHistory()).toHaveLength(ANALYSIS_HISTORY_LIMIT);
  });

  it("restaura sin volver a archivar", () => {
    const input = createDemoFormValues();
    saveLastAnalysis(makeResult({ summary: "Primero" }), input);
    const id = loadAnalysisHistory()[0].id;

    saveLastAnalysis(
      makeResult({
        summary: "Segundo",
        generatedAt: "2026-08-02T12:00:00.000Z",
      }),
      input,
    );
    expect(loadAnalysisHistory()).toHaveLength(2);

    expect(restoreHistoryEntry(id)).toBe(true);
    expect(loadLastAnalysis()?.result.summary).toBe("Primero");
    expect(loadAnalysisHistory()).toHaveLength(2);
  });

  it("elimina entradas y vacía el historial", () => {
    const input = createDemoFormValues();
    saveLastAnalysis(makeResult(), input);
    const id = loadAnalysisHistory()[0].id;
    deleteHistoryEntry(id);
    expect(loadAnalysisHistory()).toHaveLength(0);

    saveLastAnalysis(
      makeResult({ generatedAt: "2026-08-02T13:00:00.000Z" }),
      input,
    );
    clearAnalysisHistory();
    expect(loadAnalysisHistory()).toHaveLength(0);
    expect(loadLastAnalysis()).not.toBeNull();
  });

  it("clearAllLocalData borra también el historial", () => {
    const input = createDemoFormValues();
    saveLastAnalysis(makeResult(), input);
    clearAllLocalData();
    expect(loadLastAnalysis()).toBeNull();
    expect(loadAnalysisHistory()).toHaveLength(0);
  });

  it("descarta borradores corruptos", () => {
    localStorage.setItem("pujazo.formDraft.v1", "{no-json");
    expect(loadFormDraft()).toBeNull();
    expect(localStorage.getItem("pujazo.formDraft.v1")).toBeNull();
  });

  it("descarta último análisis inválido", () => {
    localStorage.setItem(
      "pujazo.lastAnalysis.v1",
      JSON.stringify({ result: { summary: "x" }, input: {} }),
    );
    expect(loadLastAnalysis()).toBeNull();
  });
});
