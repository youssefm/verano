// types.ts - Shared types for the application

import type { ProgramModeType, EchoLevelType } from "./modes";

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

/** A finished set, as actually lifted. */
export interface CompletedSet {
  reps: number;
  /** Per-cable weight used for the set (0 for Echo). */
  weightKg: number;
}

/** In-memory progress through one exercise's sets (resets on refresh). */
export interface ExerciseProgress {
  /** Finished sets in order (index 0 = set 1). */
  completedSets: CompletedSet[];
  isDone: boolean;
  skippedBurnout: boolean;
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
