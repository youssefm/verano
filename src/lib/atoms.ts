// atoms.ts - Persisted Jotai atoms for workout settings

import { atomWithStorage } from "jotai/utils";
import { Exercise } from "./types";

export const exercisesAtom = atomWithStorage<Exercise[]>(
  "verano:exercises",
  [],
  undefined,
  { getOnInit: true },
);
