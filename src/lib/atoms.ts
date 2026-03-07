// atoms.ts - Persisted Jotai atoms for workout settings

import { atomWithStorage } from "jotai/utils";
import { WorkoutConfig } from "./types";

const defaultConfig: WorkoutConfig = {
  type: "program",
  mode: 0, // OLD_SCHOOL
  weight: 10,
  reps: 10,
  progression: 0,
  isJustLift: false,
};

export const workoutConfigAtom = atomWithStorage<WorkoutConfig>(
  "verano:workoutConfig",
  defaultConfig,
);
