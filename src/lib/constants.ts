import type {
  AnalysisType,
  Formation,
  LeagueRules,
  PlatformId,
  Position,
  PlayerStatus,
  Strategy,
} from "@/lib/types";

export const PLATFORM_OPTIONS: {
  id: PlatformId;
  label: string;
  description: string;
}[] = [
  {
    id: "biwenger",
    label: "Biwenger",
    description: "Introduce tus datos manualmente; sin conexión a la cuenta.",
  },
  {
    id: "comunio",
    label: "Comunio",
    description: "Análisis local a partir de la información que indiques.",
  },
  {
    id: "laliga_fantasy",
    label: "LALIGA FANTASY",
    description: "Plan de fichajes y alineación con tus propias reglas.",
  },
  {
    id: "otro",
    label: "Otro",
    description: "Cualquier fantasy configurable por ti.",
  },
];

export const POSITION_OPTIONS: { id: Position; label: string; short: string }[] =
  [
    { id: "portero", label: "Portero", short: "POR" },
    { id: "defensa", label: "Defensa", short: "DEF" },
    { id: "centrocampista", label: "Centrocampista", short: "CEN" },
    { id: "delantero", label: "Delantero", short: "DEL" },
  ];

export const STATUS_OPTIONS: { id: PlayerStatus; label: string }[] = [
  { id: "disponible", label: "Disponible" },
  { id: "duda", label: "Duda" },
  { id: "lesionado", label: "Lesionado" },
  { id: "sancionado", label: "Sancionado" },
  { id: "no_confirmado", label: "No confirmado" },
];

export const STRATEGY_OPTIONS: {
  id: Strategy;
  label: string;
  description: string;
}[] = [
  {
    id: "seguro",
    label: "Seguro",
    description: "Prioriza margen de saldo, titulares y bajo riesgo.",
  },
  {
    id: "equilibrado",
    label: "Equilibrado",
    description: "Combina encaje posicional, precio y titularidad.",
  },
  {
    id: "agresivo",
    label: "Agresivo",
    description: "Busca impacto alto aunque reduzca el margen.",
  },
  {
    id: "especulacion",
    label: "Especulación",
    description: "Favorece valor relativo y perfiles más baratos.",
  },
];

export const ANALYSIS_TYPE_OPTIONS: {
  id: AnalysisType;
  label: string;
  description: string;
}[] = [
  {
    id: "mercado",
    label: "Mercado",
    description: "Quién fichar y a qué puja.",
  },
  {
    id: "ventas",
    label: "Ventas",
    description: "A quién vender para liberar cupo o saldo.",
  },
  {
    id: "alineacion",
    label: "Alineación",
    description: "Once, formación, banquillo.",
  },
  {
    id: "capitan",
    label: "Capitán",
    description: "Capitán (y ariete si aplica).",
  },
  {
    id: "comparar",
    label: "Comparar jugadores",
    description: "Contrasta candidatos del mercado.",
  },
  {
    id: "completo",
    label: "Revisión completa",
    description: "Plan integral de fichajes, ventas y alineación.",
  },
];

export const FORMATION_SHAPES: Record<
  Formation,
  { defensa: number; centrocampista: number; delantero: number }
> = {
  "4-4-2": { defensa: 4, centrocampista: 4, delantero: 2 },
  "4-3-3": { defensa: 4, centrocampista: 3, delantero: 3 },
  "3-4-3": { defensa: 3, centrocampista: 4, delantero: 3 },
  "3-5-2": { defensa: 3, centrocampista: 5, delantero: 2 },
  "5-3-2": { defensa: 5, centrocampista: 3, delantero: 2 },
};

export const STATUS_PENALTY: Record<PlayerStatus, number> = {
  disponible: 0,
  duda: 18,
  no_confirmado: 12,
  lesionado: 45,
  sancionado: 40,
};

export const EXAMPLE_LEAGUE_RULES: LeagueRules = {
  moneyPerPoint: 50_000,
  matchMvpBonus: 100_000,
  matchdayMvpBonus: 500_000,
  maxPlayers: 18,
  matchdayChanges: 2,
  captainEnabled: true,
  captainMultiplier: 2,
  captainDoublesNegatives: true,
  strikerEnabled: true,
  strikerBonus: 3,
  strikerMaxBonusPerMatch: 3,
  multifunctionalPlayers: true,
  clausesEnabled: true,
  clausesIrreversible: true,
  loansAllowed: true,
  maxLoanMatchdays: 5,
  salesBetweenParticipants: true,
  saleOnlyWhenOnMarket: true,
  additionalRules:
    "Los sustitutos deben pertenecer a la plantilla al inicio de la jornada. Jugadores multifunción permitidos. Cesiones de hasta cinco jornadas. Ventas entre participantes si el jugador está en el mercado. Una cláusula pagada no se puede revertir. El ariete recibe como máximo tres puntos adicionales aunque marque varios goles.",
  privateNotes:
    "Ser activo. No abandonar antes de terminar la temporada. El último clasificado paga una ronda de copas premium. Otras sanciones sociales no deben afectar al análisis deportivo.",
};

export const INDEPENDENCE_NOTICE =
  "Pujazo es una herramienta independiente y no está afiliada ni respaldada por Biwenger, Comunio, LALIGA FANTASY ni otras plataformas mencionadas.";

export const STORAGE_KEYS = {
  formDraft: "pujazo.formDraft.v1",
  lastAnalysis: "pujazo.lastAnalysis.v1",
  customRules: "pujazo.customRules.v1",
} as const;
