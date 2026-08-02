import {
  ANALYSIS_TYPE_OPTIONS,
  POSITION_OPTIONS,
  STATUS_OPTIONS,
  STRATEGY_OPTIONS,
} from "@/lib/constants";
import type {
  AnalysisType,
  PlayerStatus,
  Position,
  Strategy,
} from "@/lib/types";

export function positionLabel(position: Position): string {
  return POSITION_OPTIONS.find((p) => p.id === position)?.label ?? position;
}

export function statusLabel(status: PlayerStatus): string {
  return STATUS_OPTIONS.find((s) => s.id === status)?.label ?? status;
}

export function strategyLabel(strategy: Strategy): string {
  return STRATEGY_OPTIONS.find((s) => s.id === strategy)?.label ?? strategy;
}

export function analysisTypeLabel(type: AnalysisType): string {
  return ANALYSIS_TYPE_OPTIONS.find((t) => t.id === type)?.label ?? type;
}
