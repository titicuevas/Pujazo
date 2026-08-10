import { describe, expect, it } from "vitest";
import {
  incompleteImportIssues,
  shouldBlockPlanGeneration,
} from "@/lib/incompleteImport";

describe("incompleteImportIssues", () => {
  it("bloquea mercado sin precios en tipos de fichaje", () => {
    const issues = incompleteImportIssues({
      squad: [
        { name: "Batalla", value: 3_000_000, status: "disponible" },
        { name: "Lookman", value: 7_000_000, status: "disponible" },
        { name: "Koke", value: 2_000_000, status: "disponible" },
      ],
      market: [
        { name: "Calero", marketValue: 0, status: "disponible" },
        { name: "De Frutos", marketValue: 0, status: "disponible" },
      ],
      analysisType: "completo",
    });
    expect(shouldBlockPlanGeneration(issues, "completo")).toBe(true);
    expect(issues.some((i) => i.code === "missing_market_value")).toBe(true);
  });

  it("no bloquea alineación si el mercado no tiene precios", () => {
    const issues = incompleteImportIssues({
      squad: [
        { name: "Batalla", value: 3_000_000, status: "disponible" },
        { name: "Lookman", value: 7_000_000, status: "disponible" },
        { name: "Koke", value: 2_000_000, status: "disponible" },
      ],
      market: [{ name: "Calero", marketValue: 0, status: "disponible" }],
      analysisType: "alineacion",
    });
    expect(shouldBlockPlanGeneration(issues, "alineacion")).toBe(false);
  });
});
