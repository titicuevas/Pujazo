import { describe, expect, it } from "vitest";
import {
  applyCaptainPoints,
  applyStrikerBonus,
  buildLineup,
  mustSellBeforeBuying,
  projectedBalanceAfter,
  selectValidFormation,
} from "@/lib/analysis";
import { estimateBid, scoreMarketPlayer } from "@/lib/analysis/scoring";
import { EXAMPLE_LEAGUE_RULES } from "@/lib/constants";
import { createDemoFormValues } from "@/lib/demo";
import { analyzeTeam, actionableMissingData } from "@/lib/analysis/engine";
import {
  analysisFormSchema,
  findDuplicates,
  hasDuplicateNames,
  normalizeName,
} from "@/lib/schemas";
import type { AnalysisInput, SquadPlayer } from "@/lib/types";

function makePlayer(
  partial: Partial<SquadPlayer> & Pick<SquadPlayer, "name" | "position">,
): SquadPlayer {
  return {
    id: partial.id ?? partial.name,
    name: partial.name,
    position: partial.position,
    value: partial.value ?? 1_000_000,
    extraPositions: partial.extraPositions ?? [],
    status: partial.status ?? "disponible",
    usualStarter: partial.usualStarter ?? false,
    doNotSell: partial.doNotSell ?? false,
  };
}

describe("límite máximo de jugadores", () => {
  it("marca que hay que vender si la plantilla alcanza el máximo de 18", () => {
    expect(
      mustSellBeforeBuying({
        squadSize: 18,
        maxPlayers: 18,
        balance: 10_000_000,
        buyCost: 1_000_000,
        allowNegativeBalance: false,
      }),
    ).toBe(true);
  });

  it("los datos de ejemplo respetan 18 jugadores y máximo 18", () => {
    const demo = createDemoFormValues();
    expect(demo.squad).toHaveLength(18);
    expect(demo.maxPlayers).toBe(18);
    expect(demo.rules.maxPlayers).toBe(18);
  });
});

describe("necesidad de vender antes de fichar", () => {
  it("es true si no hay saldo suficiente", () => {
    expect(
      mustSellBeforeBuying({
        squadSize: 15,
        maxPlayers: 18,
        balance: 1_000_000,
        buyCost: 5_000_000,
        allowNegativeBalance: false,
      }),
    ).toBe(true);
  });

  it("es false con saldo y cupo", () => {
    expect(
      mustSellBeforeBuying({
        squadSize: 15,
        maxPlayers: 18,
        balance: 8_000_000,
        buyCost: 5_000_000,
        allowNegativeBalance: false,
      }),
    ).toBe(false);
  });
});

describe("saldo restante y puja máxima", () => {
  it("calcula el saldo proyectado tras ventas y compra", () => {
    expect(projectedBalanceAfter(2_000_000, [1_500_000, 900_000], 3_000_000)).toBe(
      1_400_000,
    );
  });

  it("estima puja recomendada y máxima", () => {
    const bids = estimateBid(
      {
        id: "1",
        name: "Test",
        position: "delantero",
        marketValue: 5_000_000,
        estimatedBid: 5_500_000,
        status: "disponible",
        possibleStarter: true,
      },
      10_000_000,
      "equilibrado",
    );
    expect(bids.recommended).toBeGreaterThan(0);
    expect(bids.max).toBeGreaterThanOrEqual(bids.recommended);
  });

  it("baja la puja si el candidato está lesionado", () => {
    const base = {
      id: "1",
      name: "Test",
      position: "delantero" as const,
      marketValue: 5_000_000,
      estimatedBid: 5_500_000,
      possibleStarter: true,
    };
    const fit = estimateBid({ ...base, status: "disponible" }, 10_000_000, "equilibrado");
    const hurt = estimateBid({ ...base, status: "lesionado" }, 10_000_000, "equilibrado");
    expect(hurt.recommended).toBeLessThan(fit.recommended);
  });

  it("no colapsa el techo de puja con saldo negativo", () => {
    const bids = estimateBid(
      {
        id: "1",
        name: "Test",
        position: "delantero",
        marketValue: 5_000_000,
        status: "disponible",
        possibleStarter: true,
      },
      -39_100,
      "equilibrado",
    );
    expect(bids.max).toBeGreaterThan(bids.recommended);
  });
});

describe("capitán y ariete", () => {
  it("duplica puntos positivos y negativos del capitán", () => {
    expect(applyCaptainPoints(4, 2, true)).toBe(8);
    expect(applyCaptainPoints(-3, 2, true)).toBe(-6);
  });

  it("no duplica negativos si la regla lo desactiva", () => {
    expect(applyCaptainPoints(-3, 2, false)).toBe(-3);
  });

  it("limita la bonificación del ariete a 3 aunque marque varios goles", () => {
    expect(applyStrikerBonus(1, 3, 3)).toBe(3);
    expect(applyStrikerBonus(2, 3, 3)).toBe(3);
    expect(applyStrikerBonus(5, 3, 3)).toBe(3);
  });
});

describe("alineación y formaciones", () => {
  const squad: SquadPlayer[] = [
    makePlayer({ name: "P1", position: "portero", usualStarter: true }),
    makePlayer({ name: "D1", position: "defensa", usualStarter: true }),
    makePlayer({ name: "D2", position: "defensa", usualStarter: true }),
    makePlayer({ name: "D3", position: "defensa", usualStarter: true }),
    makePlayer({ name: "D4", position: "defensa" }),
    makePlayer({ name: "C1", position: "centrocampista", usualStarter: true }),
    makePlayer({ name: "C2", position: "centrocampista", usualStarter: true }),
    makePlayer({ name: "C3", position: "centrocampista" }),
    makePlayer({
      name: "C4",
      position: "centrocampista",
      extraPositions: ["defensa"],
    }),
    makePlayer({ name: "A1", position: "delantero", usualStarter: true }),
    makePlayer({ name: "A2", position: "delantero", usualStarter: true }),
    makePlayer({ name: "A3", position: "delantero" }),
  ];

  it("elige una formación válida", () => {
    const lineup = selectValidFormation(squad, true);
    expect(lineup).not.toBeNull();
    expect(lineup?.starters).toHaveLength(11);
    expect(["4-4-2", "4-3-3", "3-4-3", "3-5-2", "5-3-2"]).toContain(
      lineup?.formation,
    );
  });

  it("penaliza lesionados o sancionados frente a disponibles", () => {
    const healthy = makePlayer({
      name: "Sano",
      position: "delantero",
      usualStarter: true,
      value: 5_000_000,
      status: "disponible",
    });
    const injured = makePlayer({
      name: "Lesion",
      position: "delantero",
      usualStarter: true,
      value: 8_000_000,
      status: "lesionado",
    });
    const lineup = buildLineup(
      [
        ...squad.filter((p) => p.position !== "delantero"),
        healthy,
        injured,
        makePlayer({ name: "Aextra", position: "delantero" }),
      ],
      EXAMPLE_LEAGUE_RULES,
    );
    const starterNames = lineup?.starters.map((s) => s.player.name) ?? [];
    expect(starterNames).toContain("Sano");
    expect(starterNames).not.toContain("Lesion");
    expect(lineup?.striker?.name).not.toBe("Lesion");
  });
});

describe("reglas personalizadas y demo", () => {
  it("carga las reglas de ejemplo esperadas", () => {
    expect(EXAMPLE_LEAGUE_RULES.moneyPerPoint).toBe(50_000);
    expect(EXAMPLE_LEAGUE_RULES.matchMvpBonus).toBe(100_000);
    expect(EXAMPLE_LEAGUE_RULES.matchdayMvpBonus).toBe(500_000);
    expect(EXAMPLE_LEAGUE_RULES.matchdayChanges).toBe(2);
    expect(EXAMPLE_LEAGUE_RULES.captainDoublesNegatives).toBe(true);
    expect(EXAMPLE_LEAGUE_RULES.strikerBonus).toBe(3);
    expect(EXAMPLE_LEAGUE_RULES.strikerMaxBonusPerMatch).toBe(3);
    expect(EXAMPLE_LEAGUE_RULES.maxPlayers).toBe(18);
    expect(EXAMPLE_LEAGUE_RULES.maxLoanMatchdays).toBe(5);
  });

  it("el análisis demo exige venta y propone fichaje", () => {
    const demo = createDemoFormValues();
    const result = analyzeTeam(demo as AnalysisInput);
    expect(result.mustSellBeforeBuy).toBe(true);
    expect(result.primaryTarget).toBeTruthy();
    expect(result.alternativeTarget).toBeTruthy();
    expect(result.sellRecommendations.length).toBeGreaterThan(0);
    expect(result.lineup?.captain).toBeTruthy();
    expect(result.lineup?.striker).toBeTruthy();
    expect(
      result.sellRecommendations.every((p) => !p.doNotSell),
    ).toBe(true);
    expect(result.summary).toContain("Equilibrado");
    expect(result.marketRanking?.length).toBeGreaterThan(1);
    expect(result.marketRanking?.length).toBeLessThanOrEqual(3);
    expect(result.reasons.some((r) => /Top \d+ fichajes/i.test(r))).toBe(true);
  });

  it("en modo comparar genera ranking de candidatos", () => {
    const demo = createDemoFormValues();
    demo.analysisType = "comparar";
    const result = analyzeTeam(demo as AnalysisInput);
    expect(result.marketRanking?.length).toBeGreaterThan(1);
    expect(result.marketRanking?.[0]?.player.name).toBe(
      result.primaryTarget?.player.name,
    );
    expect(result.summary).toMatch(/Comparativa/i);
    expect(result.lineup).toBeUndefined();
    expect(
      result.alternativePlan.some((line) => line.startsWith("1.")),
    ).toBe(true);
  });

  it("respeta capitán y ariete desactivados", () => {
    const demo = createDemoFormValues();
    demo.rules.captainEnabled = false;
    demo.rules.strikerEnabled = false;
    const result = analyzeTeam(demo as AnalysisInput);
    expect(result.lineup?.captain).toBeUndefined();
    expect(result.lineup?.striker).toBeUndefined();
    expect(result.reasons.some((r) => r.includes("capitán está desactivada"))).toBe(
      true,
    );
  });
});

describe("validación de duplicados", () => {
  it("detecta nombres duplicados", () => {
    expect(hasDuplicateNames(["Ana", "ana", "Luis"])).toBe(true);
    expect(findDuplicates(["ana", "ana", "luis"])).toEqual(["ana"]);
    expect(normalizeName("  Juan  Pérez ")).toBe("juan pérez");
  });

  it("rechaza plantilla con nombres duplicados en el schema", () => {
    const demo = createDemoFormValues();
    demo.squad[1] = { ...demo.squad[1], name: demo.squad[0].name };
    const parsed = analysisFormSchema.safeParse(demo);
    expect(parsed.success).toBe(false);
  });
});

describe("puntuación de mercado", () => {
  it("prioriza candidatos que encajan y están disponibles", () => {
    const input = createDemoFormValues() as AnalysisInput;
    const scored = input.market.map((p) => scoreMarketPlayer(p, input));
    expect(scored.every((s) => Number.isFinite(s.score))).toBe(true);
  });
});

describe("datos que faltan", () => {
  it("no mete el disclaimer de tiempo real en missingData", () => {
    const result = analyzeTeam(createDemoFormValues() as AnalysisInput);
    expect(
      result.missingData.some((item) => /tiempo real/i.test(item)),
    ).toBe(false);
  });

  it("señala mercado vacío como hueco accionable", () => {
    const gaps = actionableMissingData([
      "No hay jugadores en el mercado para recomendar fichajes.",
      "No se indicó una duda concreta; el plan es genérico según el tipo de análisis.",
    ]);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]).toMatch(/mercado/);
  });
});
