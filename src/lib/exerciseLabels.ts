// exerciseLabels.ts - Human-readable descriptions of exercises

import type { Exercise } from "./types";
import { ProgramModeNames, EchoLevelNames } from "./modes";

/** Short mode name, e.g. "Old School" or "Echo Harder". */
export function modeName(exercise: Exercise): string {
  const { config } = exercise;
  return config.type === "echo"
    ? `Echo ${EchoLevelNames[config.level]}`
    : ProgramModeNames[config.mode];
}

/** Settings other than the mode, e.g. "10 reps · +0.5 kg/rep" or "100% ecc · Just Lift". */
export function describeSettings(exercise: Exercise): string {
  const { config } = exercise;
  const parts: string[] = [];
  if (config.type === "echo") parts.push(`${config.eccentricPct}% ecc`);
  if (!config.isJustLift) {
    parts.push(
      `${config.type === "echo" ? config.targetReps : config.reps} reps`
    );
  }
  if (config.type === "program" && config.progression !== 0) {
    parts.push(
      `${config.progression > 0 ? "+" : ""}${config.progression} kg/rep`
    );
  }
  if (config.isJustLift) parts.push("Just Lift");
  return parts.join(" · ");
}

/** e.g. "Old School · 10 reps · +0.5 kg/rep" or "Echo Harder · 100% ecc · Just Lift" */
export function describeExercise(exercise: Exercise): string {
  return `${modeName(exercise)} · ${describeSettings(exercise)}`;
}

export function formatKg(kg: number): string {
  return `${kg.toFixed(1)} kg`;
}
