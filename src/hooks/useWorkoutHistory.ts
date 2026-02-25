// hooks/useWorkoutHistory.ts - Manage completed workout history

import { useState, useCallback } from "react";
import { Workout } from "../lib/types";

export interface UseWorkoutHistoryReturn {
  workoutHistory: Workout[];
  addWorkout: (workout: Workout) => void;
  viewWorkoutOnGraph: (index: number) => Workout | null;
}

export function useWorkoutHistory(): UseWorkoutHistoryReturn {
  const [workoutHistory, setWorkoutHistory] = useState<Workout[]>([]);

  const addWorkout = useCallback((workout: Workout) => {
    setWorkoutHistory((prev) => [workout, ...prev]);
    console.log("[SUCCESS] Workout completed and saved to history");
  }, []);

  const viewWorkoutOnGraph = useCallback(
    (index: number): Workout | null => {
      if (index < 0 || index >= workoutHistory.length) {
        console.error("[ERROR] Invalid workout index");
        return null;
      }
      return workoutHistory[index];
    },
    [workoutHistory],
  );

  return { workoutHistory, addWorkout, viewWorkoutOnGraph };
}
