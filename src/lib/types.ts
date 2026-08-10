export type PlatformId = "biwenger" | "comunio" | "laliga_fantasy" | "otro";

export type Position = "portero" | "defensa" | "centrocampista" | "delantero";

export type PlayerStatus =
  | "disponible"
  | "duda"
  | "lesionado"
  | "sancionado"
  | "no_confirmado";

export type Strategy = "seguro" | "equilibrado" | "agresivo" | "especulacion";

export type AnalysisType =
  | "mercado"
  | "ventas"
  | "alineacion"
  | "capitan"
  | "comparar"
  | "completo";

export type RiskLevel = "bajo" | "medio" | "alto";

export type Formation = "4-4-2" | "4-3-3" | "3-4-3" | "3-5-2" | "5-3-2";

export interface SquadPlayer {
  id: string;
  name: string;
  position: Position;
  value: number;
  extraPositions: Position[];
  status: PlayerStatus;
  usualStarter: boolean;
  doNotSell: boolean;
}

export interface MarketPlayer {
  id: string;
  name: string;
  position: Position;
  marketValue: number;
  minPrice?: number;
  estimatedBid?: number;
  status: PlayerStatus;
  possibleStarter: boolean;
}

export interface LeagueRules {
  moneyPerPoint: number;
  matchMvpBonus: number;
  matchdayMvpBonus: number;
  maxPlayers: number;
  matchdayChanges: number;
  captainEnabled: boolean;
  captainMultiplier: number;
  captainDoublesNegatives: boolean;
  strikerEnabled: boolean;
  strikerBonus: number;
  strikerMaxBonusPerMatch: number;
  multifunctionalPlayers: boolean;
  clausesEnabled: boolean;
  clausesIrreversible: boolean;
  loansAllowed: boolean;
  maxLoanMatchdays: number;
  salesBetweenParticipants: boolean;
  saleOnlyWhenOnMarket: boolean;
  additionalRules: string;
  privateNotes: string;
}

export interface AnalysisInput {
  platform: PlatformId;
  customPlatformName?: string;
  leagueName?: string;
  participants: number;
  currentPosition: number;
  matchday: number;
  strategy: Strategy;
  squad: SquadPlayer[];
  balance: number;
  maxPlayers: number;
  allowNegativeBalance: boolean;
  market: MarketPlayer[];
  rules: LeagueRules;
  analysisType: AnalysisType;
  concreteDoubt?: string;
}

export interface ScoredMarketPlayer {
  player: MarketPlayer;
  score: number;
  reasons: string[];
  risk: RiskLevel;
  recommendedBid: number;
  /** Techo razonable de “sigue siendo buena compra”. */
  goodBuyCeiling?: number;
  maxBid: number;
}

export interface LineupSlot {
  position: Position;
  player: SquadPlayer;
}

export interface LineupResult {
  formation: Formation;
  starters: LineupSlot[];
  bench: SquadPlayer[];
  captain?: SquadPlayer;
  striker?: SquadPlayer;
  reasons: string[];
}

export interface AnalysisResult {
  summary: string;
  primaryTarget?: ScoredMarketPlayer;
  alternativeTarget?: ScoredMarketPlayer;
  /** Top candidatos ordenados (modo comparar / mercado / completo) */
  marketRanking?: ScoredMarketPlayer[];
  recommendedBid?: number;
  /** Techo de buena compra del fichaje prioritario */
  goodBuyCeiling?: number;
  maxBid?: number;
  sellRecommendations: SquadPlayer[];
  doNotSell: SquadPlayer[];
  projectedBalance: number;
  mustSellBeforeBuy: boolean;
  lineup?: LineupResult;
  overallRisk: RiskLevel;
  reasons: string[];
  alternativePlan: string[];
  missingData: string[];
  warnings: string[];
  generatedAt: string;
}
