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

export interface ProgramWorkoutConfig {
  type: "program";
  mode: ProgramModeType;
  weight: number;
  reps: number;
  progression: number;
  isJustLift: boolean;
}

export interface EchoWorkoutConfig {
  type: "echo";
  level: EchoLevelType;
  eccentricPct: number;
  targetReps: number;
  isJustLift: boolean;
}

export type WorkoutConfig = ProgramWorkoutConfig | EchoWorkoutConfig;

export interface LiveStats {
  posA: number;
  posB: number;
  loadA: number;
  loadB: number;
  ticks: number;
}

export interface Exercise {
  id: string;
  name: string;
  config: WorkoutConfig;
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

export interface MonitorSample {
  timestamp: Date;
  ticks: number;
  posA: number;
  posB: number;
  loadA: number;
  loadB: number;
  raw?: Uint8Array;
}
