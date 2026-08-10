import { beforeEach, describe, expect, it } from "vitest";
import {
  buildMatchdayActions,
  clearMatchdayChecklist,
  loadMatchdayChecklist,
  matchdayChecklistProgress,
  toggleMatchdayAction,
} from "@/lib/actionChecklist";
import type { AnalysisResult } from "@/lib/types";

function makeResult(overrides?: Partial<AnalysisResult>): AnalysisResult {
  return {
    summary: "Plan",
    sellRecommendations: [
      {
        id: "s1",
        name: "Suplente",
        position: "delantero",
        value: 100_000,
        status: "disponible",
        usualStarter: false,
        doNotSell: false,
      },
    ],
    doNotSell: [],
    primaryTarget: {
      player: {
        id: "m1",
        name: "Estrella",
        position: "delantero",
        marketValue: 5_000_000,
        status: "disponible",
      },
      score: 80,
      risk: "medio",
      recommendedBid: 5_200_000,
      maxBid: 5_800_000,
      reasons: ["Encaja"],
    },
    recommendedBid: 5_200_000,
    maxBid: 5_800_000,
    projectedBalance: 500_000,
    mustSellBeforeBuy: true,
    overallRisk: "medio",
    reasons: [],
    alternativePlan: [],
    missingData: [],
    warnings: [],
    generatedAt: "2026-08-10T12:00:00.000Z",
    lineup: {
      formation: "4-3-3",
      starters: [],
      captain: {
        id: "c1",
        name: "Capitan",
        position: "centrocampista",
        value: 3_000_000,
        status: "disponible",
        usualStarter: true,
        doNotSell: true,
      },
    },
    ...overrides,
  };
}

describe("actionChecklist", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("construye acciones de venta, puja y once", () => {
    const actions = buildMatchdayActions(makeResult());
    const labels = actions.map((a) => a.label).join(" | ");
    expect(labels).toMatch(/Vender antes/);
    expect(labels).toMatch(/Vender Suplente/);
    expect(labels).toMatch(/Pujar por Estrella/);
    expect(labels).toMatch(/alineación 4-3-3/);
    expect(labels).toMatch(/Capitán: Capitan/);
  });

  it("persiste checks por análisis", () => {
    const id = "2026-08-10T12:00:00.000Z";
    const actions = buildMatchdayActions(makeResult());
    const first = actions[0].id;
    toggleMatchdayAction(id, first);
    expect(loadMatchdayChecklist(id).has(first)).toBe(true);
    toggleMatchdayAction(id, first);
    expect(loadMatchdayChecklist(id).has(first)).toBe(false);
  });

  it("reinicia marcas y reporta progreso", () => {
    const result = makeResult();
    const id = result.generatedAt;
    const first = buildMatchdayActions(result)[0].id;
    toggleMatchdayAction(id, first);
    expect(matchdayChecklistProgress(result)).toEqual({
      done: 1,
      total: buildMatchdayActions(result).length,
    });
    clearMatchdayChecklist(id);
    expect(matchdayChecklistProgress(result)?.done).toBe(0);
  });
});
