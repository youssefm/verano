// sets.ts - Set tracking constants, weight calculation, and per-exercise progress

import type { CompletedSet, Exercise, ExerciseProgress } from "./types";

export const TOTAL_SETS = 3;
export const SET_REDUCTION = 0.1;
const BURNOUT_SET = TOTAL_SETS + 1;

export const EMPTY_PROGRESS: ExerciseProgress = {
  completedSets: [],
  isDone: false,
  skippedBurnout: false,
};

/** Return the effective weight for a given set number (1-based). */
export function getSetWeight(baseWeight: number, set: number): number {
  return +(baseWeight * Math.pow(1 - SET_REDUCTION, set - 1)).toFixed(1);
}

/** The optional open-ended set after the working sets. */
export function isBurnoutSet(set: number): boolean {
  return set > TOTAL_SETS;
}

/** The exercise's rep target (0 means none). */
export function getTargetReps(exercise: Exercise): number {
  const { config } = exercise;
  return config.type === "echo" ? config.targetReps : config.reps;
}

/**
 * A set with no rep target: Just Lift, burnout, or a 0-rep target. These end
 * when the user is done, so a manual Stop counts them; sets with a target
 * only count when the target is reached.
 */
export function isOpenEndedSet(exercise: Exercise, set: number): boolean {
  return (
    isBurnoutSet(set) ||
    exercise.config.isJustLift ||
    getTargetReps(exercise) === 0
  );
}

/** Burnout only applies to program exercises (echo resistance is adaptive). */
function hasBurnoutSet(exercise: Exercise): boolean {
  return exercise.config.type === "program";
}

/** Set numbers an exercise goes through, including burnout when applicable. */
export function getSetNumbers(exercise: Exercise): number[] {
  const sets = Array.from({ length: TOTAL_SETS }, (_, index) => index + 1);
  return hasBurnoutSet(exercise) ? [...sets, BURNOUT_SET] : sets;
}

/** The set the user does next (1-based); BURNOUT_SET once the working sets are done. */
export function getCurrentSet(progress: ExerciseProgress): number {
  return progress.completedSets.length + 1;
}

export function getTotalReps(progress: ExerciseProgress): number {
  return progress.completedSets.reduce((total, set) => total + set.reps, 0);
}

/** Record a finished set and work out whether the exercise is now complete. */
export function recordCompletedSet(
  exercise: Exercise,
  progress: ExerciseProgress,
  completedSet: CompletedSet
): ExerciseProgress {
  const completedSets = [...progress.completedSets, completedSet];
  const isDone = completedSets.length >= getSetNumbers(exercise).length;
  return { ...progress, completedSets, isDone };
}
