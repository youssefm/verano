// types.ts - Shared types for the application

import { ProgramModeType, EchoLevelType } from "./modes";

export interface PositionRange {
  min: number;
  max: number;
}

export interface CurrentWorkout {
  mode: string;
  weightKg: number;
  targetReps: number;
  startTime: Date;
  warmupEndTime: Date | null;
  endTime: Date | null;
}

export interface Workout {
  mode: string;
  weightKg: number;
  reps: number;
  timestamp: Date;
  startTime?: Date;
  warmupEndTime?: Date | null;
  endTime?: Date;
}

export interface LogEntry {
  id: number;
  message: string;
  type: "info" | "success" | "error";
  timestamp: Date;
}

export interface ProgramFormState {
  mode: ProgramModeType;
  weight: number;
  progression: number;
  reps: number;
  justLiftMode: boolean;
}

export interface EchoFormState {
  level: EchoLevelType;
  eccentricPct: number;
  targetReps: number;
  justLiftMode: boolean;
}

export interface LiveStats {
  posA: number;
  posB: number;
  loadA: number;
  loadB: number;
  ticks: number;
}

export interface RepRanges {
  minRepPosA: number | null;
  maxRepPosA: number | null;
  minRepPosB: number | null;
  maxRepPosB: number | null;
  minRepPosARange: PositionRange | null;
  maxRepPosARange: PositionRange | null;
  minRepPosBRange: PositionRange | null;
  maxRepPosBRange: PositionRange | null;
}
