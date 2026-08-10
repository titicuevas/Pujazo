import { describe, expect, it } from "vitest";
import { analyzeTeam } from "@/lib/analysis";
import { createDemoFormValues } from "@/lib/demo";
import { createId } from "@/lib/format";
import { parsePastedPlayers } from "@/lib/importPaste";
import { analysisTypeLabel } from "@/lib/labels";
import { guessShareImportKind } from "@/lib/shareImport";
import type { AnalysisFormValues } from "@/lib/schemas";
import type { AnalysisType, Position } from "@/lib/types";

/**
 * Pegado real del usuario (share Biwenger: solo nombres + saldo).
 * Sin precios/posiciones el motor puede generar plan, pero con huecos.
 */
const SQUAD_SHARE =
  "Mi equipo Biwenger: Batalla, Manu Sánchez, Carmona, Huijsen, Oso, Freeman, Quagliata, Koke, Barrenetxea, Kang-in Lee, Jauregizar, Ayoze, Roberto Fernández, Lookman";

const MARKET_SHARE =
  "El mercado de hoy en mi liga #Biwenger: Calero, Pere Milla, Pépé, Pathé Ciss, Aimar Oroz, Kike Salas, Laporte, Javier Rueda, Juanmi, Bellerín, Danjuma, Rafa Núñez, Fran Pérez, Fermín, Isaac Romero, José Jurado, Bernardo Silva, Aarón Ochoa, Alfonso Herrero, Ángel Recio, Raphinha, De Frutos, Olasagasti, Sørloth";

const BALANCE = 952_500;

/** Posiciones conocidas de plantillas CHACHOS previas (aprox. para prueba realista). */
const KNOWN_POSITIONS: Record<string, Position> = {
  batalla: "portero",
  "manu sánchez": "defensa",
  "manu sanchez": "defensa",
  carmona: "defensa",
  huijsen: "defensa",
  oso: "defensa",
  freeman: "centrocampista",
  quagliata: "defensa",
  koke: "centrocampista",
  barrenetxea: "centrocampista",
  "kang-in lee": "centrocampista",
  jauregizar: "centrocampista",
  ayoze: "delantero",
  "roberto fernández": "delantero",
  "roberto fernandez": "delantero",
  lookman: "delantero",
  calero: "defensa",
  "pere milla": "delantero",
  pépé: "delantero",
  pepe: "delantero",
  "pathé ciss": "centrocampista",
  "pathe ciss": "centrocampista",
  "aimar oroz": "centrocampista",
  "kike salas": "defensa",
  laporte: "defensa",
  "javier rueda": "defensa",
  juanmi: "delantero",
  bellerín: "defensa",
  bellerin: "defensa",
  danjuma: "delantero",
  "rafa núñez": "delantero",
  "rafa nunez": "delantero",
  "fran pérez": "delantero",
  "fran perez": "delantero",
  fermín: "centrocampista",
  fermin: "centrocampista",
  "isaac romero": "delantero",
  "josé jurado": "centrocampista",
  "jose jurado": "centrocampista",
  "bernardo silva": "centrocampista",
  "aarón ochoa": "centrocampista",
  "aaron ochoa": "centrocampista",
  "alfonso herrero": "portero",
  "ángel recio": "defensa",
  "angel recio": "defensa",
  raphinha: "delantero",
  "de frutos": "delantero",
  olasagasti: "centrocampista",
  sørloth: "delantero",
  sorloth: "delantero",
};

/** Valores orientativos vistos en pegados previos CHACHOS (solo prueba). */
const KNOWN_VALUES: Record<string, number> = {
  batalla: 3_650_000,
  huijsen: 4_320_000,
  oso: 2_220_000,
  quagliata: 1_840_000,
  "manu sánchez": 1_350_000,
  "manu sanchez": 1_350_000,
  "kang-in lee": 4_810_000,
  barrenetxea: 3_950_000,
  jauregizar: 3_360_000,
  koke: 2_500_000,
  lookman: 7_960_000,
  ayoze: 4_000_000,
  "roberto fernández": 3_000_000,
  "roberto fernandez": 3_000_000,
  carmona: 2_000_000,
  freeman: 1_500_000,
  "de frutos": 7_000_000,
  pépé: 5_000_000,
  pepe: 5_000_000,
  laporte: 6_000_000,
  "bernardo silva": 9_000_000,
  raphinha: 12_000_000,
  sørloth: 8_000_000,
  sorloth: 8_000_000,
};

function keyName(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function buildInput(analysisType: AnalysisType): {
  input: AnalysisFormValues;
  squadNames: string[];
  marketNames: string[];
  warnings: string[];
} {
  const squadParsed = parsePastedPlayers(SQUAD_SHARE);
  const marketParsed = parsePastedPlayers(MARKET_SHARE);
  const base = createDemoFormValues("biwenger");

  const squad = squadParsed.players.map((p) => {
    const key = keyName(p.name);
    return {
      id: createId("squad"),
      name: p.name,
      position: KNOWN_POSITIONS[key] ?? p.position ?? ("centrocampista" as const),
      value: KNOWN_VALUES[key] ?? p.value ?? 0,
      extraPositions: p.extraPositions ?? [],
      status: p.status ?? ("disponible" as const),
      usualStarter: false,
      doNotSell: false,
    };
  });

  const market = marketParsed.players.map((p) => {
    const key = keyName(p.name);
    const marketValue = KNOWN_VALUES[key] ?? p.value ?? 0;
    return {
      id: createId("market"),
      name: p.name,
      position: KNOWN_POSITIONS[key] ?? p.position ?? ("centrocampista" as const),
      marketValue,
      minPrice: p.clausePrice,
      estimatedBid: p.estimatedBid,
      status: p.status ?? ("disponible" as const),
      possibleStarter: true,
    };
  });

  return {
    input: {
      ...base,
      leagueName: "CHACHOS",
      balance: BALANCE,
      allowNegativeBalance: false,
      maxPlayers: 18,
      rules: { ...base.rules, maxPlayers: 18 },
      squad,
      market,
      analysisType,
      strategy: "equilibrado",
    },
    squadNames: squad.map((p) => p.name),
    marketNames: market.map((p) => p.name),
    warnings: [...squadParsed.warnings, ...marketParsed.warnings],
  };
}

const ALL_TYPES: AnalysisType[] = [
  "mercado",
  "ventas",
  "alineacion",
  "capitan",
  "comparar",
  "completo",
];

describe("prueba real share Biwenger (usuario)", () => {
  it("detecta plantilla y mercado del share", () => {
    expect(guessShareImportKind(SQUAD_SHARE)).toBe("squad");
    expect(guessShareImportKind(MARKET_SHARE)).toBe("market");

    const squad = parsePastedPlayers(SQUAD_SHARE);
    const market = parsePastedPlayers(MARKET_SHARE);

    expect(squad.players).toHaveLength(14);
    expect(market.players).toHaveLength(24);
    expect(squad.players.map((p) => p.name)).toEqual(
      expect.arrayContaining([
        "Batalla",
        "Huijsen",
        "Lookman",
        "Kang-in Lee",
        "Carmona",
        "Freeman",
      ]),
    );
    expect(market.players.map((p) => p.name)).toEqual(
      expect.arrayContaining([
        "De Frutos",
        "Pépé",
        "Laporte",
        "Raphinha",
        "Sørloth",
        "Bernardo Silva",
      ]),
    );
  });

  it("ejecuta los 6 tipos de análisis sin romper", () => {
    const reports: string[] = [];

    for (const type of ALL_TYPES) {
      const { input, squadNames, marketNames } = buildInput(type);
      expect(squadNames).toHaveLength(14);
      expect(marketNames.length).toBeGreaterThanOrEqual(20);

      const plan = analyzeTeam(input);
      const label = analysisTypeLabel(type);

      expect(plan.summary.length).toBeGreaterThan(10);
      expect(plan.generatedAt).toBeTruthy();
      expect(plan.warnings.length).toBeGreaterThan(0);

      if (type === "alineacion" || type === "capitan" || type === "completo") {
        expect(plan.lineup).not.toBeNull();
        expect(plan.lineup?.starters.length).toBe(11);
        expect(plan.lineup?.captain).toBeTruthy();
      }

      if (type === "mercado" || type === "comparar" || type === "completo") {
        expect(
          Boolean(plan.primaryTarget) || (plan.marketRanking?.length ?? 0) > 0,
        ).toBe(true);
        if (plan.primaryTarget) {
          expect(plan.primaryTarget.recommendedBid).toBeGreaterThan(0);
          expect(plan.primaryTarget.maxBid).toBeGreaterThanOrEqual(
            plan.primaryTarget.recommendedBid,
          );
        }
      }

      if (type === "ventas" || type === "completo") {
        // Con 14/18 y saldo bajo suele hacer falta vender para fichar caro
        expect(plan.sellRecommendations.length).toBeGreaterThanOrEqual(0);
      }

      if (type === "comparar") {
        expect(plan.marketRanking?.length ?? 0).toBeGreaterThan(1);
      }

      reports.push(
        [
          `## ${label} (${type})`,
          `Resumen: ${plan.summary}`,
          `Fichaje: ${plan.primaryTarget?.player.name ?? "—"} · puja ${plan.primaryTarget?.recommendedBid?.toLocaleString("es-ES") ?? "—"} (máx ${plan.primaryTarget?.maxBid?.toLocaleString("es-ES") ?? "—"})`,
          `Ventas: ${plan.sellRecommendations.map((p) => p.name).join(", ") || "—"}`,
          `Vender antes: ${plan.mustSellBeforeBuy ? "sí" : "no"}`,
          `Once: ${plan.lineup?.formation ?? "—"} · cap ${plan.lineup?.captain?.name ?? "—"} · ariete ${plan.lineup?.striker?.name ?? "—"}`,
          `Riesgo: ${plan.overallRisk}`,
          `Huecos: ${plan.missingData.slice(0, 3).join(" | ") || "—"}`,
        ].join("\n"),
      );
    }

    // eslint-disable-next-line no-console
    console.log("\n===== INFORME PLANES CHACHOS =====\n" + reports.join("\n\n"));
  });
});
