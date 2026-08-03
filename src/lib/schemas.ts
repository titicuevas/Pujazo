import { z } from "zod";

const moneySchema = z
  .number({ error: "Introduce un valor numérico válido." })
  .min(0, "Los valores monetarios no pueden ser negativos.");

export const positionSchema = z.enum([
  "portero",
  "defensa",
  "centrocampista",
  "delantero",
]);

export const statusSchema = z.enum([
  "disponible",
  "duda",
  "lesionado",
  "sancionado",
  "no_confirmado",
]);

export const squadPlayerSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "El nombre del jugador es obligatorio."),
  position: positionSchema,
  value: moneySchema,
  extraPositions: z.array(positionSchema),
  status: statusSchema,
  usualStarter: z.boolean(),
  doNotSell: z.boolean(),
});

export const marketPlayerSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "El nombre del jugador es obligatorio."),
  position: positionSchema,
  marketValue: moneySchema,
  minPrice: z
    .number()
    .min(0, "El precio mínimo no puede ser negativo.")
    .optional(),
  estimatedBid: z
    .number()
    .min(0, "La puja estimada no puede ser negativa.")
    .optional(),
  status: statusSchema,
  possibleStarter: z.boolean(),
});

export const leagueRulesSchema = z.object({
  moneyPerPoint: moneySchema,
  matchMvpBonus: moneySchema,
  matchdayMvpBonus: moneySchema,
  maxPlayers: z
    .number()
    .int("El máximo de jugadores debe ser un entero.")
    .min(11, "El máximo debe ser al menos 11.")
    .max(40, "El máximo no puede superar 40."),
  matchdayChanges: z
    .number()
    .int()
    .min(0, "Los cambios no pueden ser negativos.")
    .max(11),
  captainEnabled: z.boolean(),
  captainMultiplier: z.number().min(1).max(5),
  captainDoublesNegatives: z.boolean(),
  strikerEnabled: z.boolean(),
  strikerBonus: z.number().min(0).max(10),
  strikerMaxBonusPerMatch: z.number().min(0).max(20),
  multifunctionalPlayers: z.boolean(),
  clausesEnabled: z.boolean(),
  clausesIrreversible: z.boolean(),
  loansAllowed: z.boolean(),
  maxLoanMatchdays: z.number().int().min(0).max(38),
  salesBetweenParticipants: z.boolean(),
  saleOnlyWhenOnMarket: z.boolean(),
  additionalRules: z.string(),
  privateNotes: z.string(),
});

export const analysisFormSchema = z
  .object({
    platform: z.enum(["biwenger", "comunio", "laliga_fantasy", "otro"]),
    customPlatformName: z.string().optional(),
    leagueName: z.string().optional(),
    participants: z
      .number()
      .int()
      .min(2, "Indica al menos 2 participantes.")
      .max(100),
    currentPosition: z
      .number()
      .int()
      .min(1, "La posición debe ser al menos 1."),
    matchday: z.number().int().min(1).max(50),
    strategy: z.enum(["seguro", "equilibrado", "agresivo", "especulacion"]),
    squad: z.array(squadPlayerSchema).min(1, "Añade al menos un jugador."),
    balance: z
      .number({ error: "Introduce un saldo válido." })
      .refine((v) => !Number.isNaN(v), "Introduce un saldo válido."),
    maxPlayers: z
      .number()
      .int()
      .min(11, "El máximo de jugadores debe ser al menos 11.")
      .max(40),
    allowNegativeBalance: z.boolean(),
    market: z.array(marketPlayerSchema),
    rules: leagueRulesSchema,
    analysisType: z.enum([
      "mercado",
      "ventas",
      "alineacion",
      "capitan",
      "comparar",
      "completo",
    ]),
    concreteDoubt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.platform === "otro" && !data.customPlatformName?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["customPlatformName"],
        message: "Indica el nombre de tu fantasy.",
      });
    }

    if (data.currentPosition > data.participants) {
      ctx.addIssue({
        code: "custom",
        path: ["currentPosition"],
        message: "La posición no puede superar el número de participantes.",
      });
    }

    if (!data.allowNegativeBalance && data.balance < 0) {
      ctx.addIssue({
        code: "custom",
        path: ["balance"],
        message: "El saldo no puede ser negativo con la configuración actual.",
      });
    }

    const squadNames = data.squad.map((p) => normalizeName(p.name));
    const squadDupes = findDuplicates(squadNames);
    for (const name of squadDupes) {
      ctx.addIssue({
        code: "custom",
        path: ["squad"],
        message: `Hay jugadores duplicados en la plantilla: ${name}.`,
      });
    }

    const marketNames = data.market.map((p) => normalizeName(p.name));
    const marketNameSet = new Set(marketNames);
    const marketDupes = findDuplicates(marketNames);
    for (const name of marketDupes) {
      ctx.addIssue({
        code: "custom",
        path: ["market"],
        message: `Hay jugadores duplicados en el mercado: ${name}.`,
      });
    }

    const overlap = squadNames.filter((n) => marketNameSet.has(n));
    for (const name of [...new Set(overlap)]) {
      ctx.addIssue({
        code: "custom",
        path: ["market"],
        message: `"${name}" aparece a la vez en plantilla y mercado.`,
      });
    }

    if (data.squad.length > data.maxPlayers) {
      ctx.addIssue({
        code: "custom",
        path: ["squad"],
        message: `Has superado el máximo de ${data.maxPlayers} jugadores.`,
      });
    }
  });

export type AnalysisFormValues = z.infer<typeof analysisFormSchema>;

/** Borrador local: admite plantilla vacía y sin superRefine estricto. */
export const formDraftSchema = z.object({
  platform: z.enum(["biwenger", "comunio", "laliga_fantasy", "otro"]),
  customPlatformName: z.string().optional(),
  leagueName: z.string().optional(),
  participants: z.number().int().min(2).max(100),
  currentPosition: z.number().int().min(1),
  matchday: z.number().int().min(1).max(50),
  strategy: z.enum(["seguro", "equilibrado", "agresivo", "especulacion"]),
  squad: z.array(squadPlayerSchema),
  balance: z.number(),
  maxPlayers: z.number().int().min(11).max(40),
  allowNegativeBalance: z.boolean(),
  market: z.array(marketPlayerSchema),
  rules: leagueRulesSchema,
  analysisType: z.enum([
    "mercado",
    "ventas",
    "alineacion",
    "capitan",
    "comparar",
    "completo",
  ]),
  concreteDoubt: z.string().optional(),
});

const riskSchema = z.enum(["bajo", "medio", "alto"]);

const scoredMarketPlayerSchema = z.object({
  player: marketPlayerSchema,
  score: z.number(),
  reasons: z.array(z.string()),
  risk: riskSchema,
  recommendedBid: z.number(),
  maxBid: z.number(),
});

export const analysisResultSchema = z.object({
  summary: z.string(),
  primaryTarget: scoredMarketPlayerSchema.optional(),
  alternativeTarget: scoredMarketPlayerSchema.optional(),
  marketRanking: z.array(scoredMarketPlayerSchema).optional(),
  recommendedBid: z.number().optional(),
  maxBid: z.number().optional(),
  sellRecommendations: z.array(squadPlayerSchema),
  doNotSell: z.array(squadPlayerSchema),
  projectedBalance: z.number(),
  mustSellBeforeBuy: z.boolean(),
  lineup: z
    .object({
      formation: z.enum(["4-4-2", "4-3-3", "3-4-3", "3-5-2", "5-3-2"]),
      starters: z.array(
        z.object({
          position: positionSchema,
          player: squadPlayerSchema,
        }),
      ),
      bench: z.array(squadPlayerSchema),
      captain: squadPlayerSchema.optional(),
      striker: squadPlayerSchema.optional(),
      reasons: z.array(z.string()),
    })
    .optional(),
  overallRisk: riskSchema,
  reasons: z.array(z.string()),
  alternativePlan: z.array(z.string()),
  missingData: z.array(z.string()),
  warnings: z.array(z.string()),
  generatedAt: z.string(),
});

export const storedAnalysisSnapshotSchema = z.object({
  result: analysisResultSchema,
  input: analysisFormSchema,
});

export const analysisHistoryEntrySchema = z.object({
  id: z.string().min(1),
  savedAt: z.string(),
  title: z.string(),
  result: analysisResultSchema,
  input: analysisFormSchema,
});

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function findDuplicates(names: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const name of names) {
    if (!name) continue;
    if (seen.has(name)) dupes.add(name);
    else seen.add(name);
  }
  return [...dupes];
}

export function hasDuplicateNames(names: string[]): boolean {
  return findDuplicates(names.map(normalizeName)).length > 0;
}
