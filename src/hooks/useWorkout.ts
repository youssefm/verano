// hooks/useWorkout.ts - Orchestrates workout lifecycle, composing sub-hooks

import { useState, useCallback } from "react";
import { MonitorSample } from "../lib/chart";
import { CurrentWorkout, Workout, LiveStats } from "../lib/types";
import { useRepRanges } from "./useRepRanges";
import { useAutoStop } from "./useAutoStop";
import { useRepCounter } from "./useRepCounter";
import { useWorkoutHistory } from "./useWorkoutHistory";

export interface UseWorkoutReturn {
  // Workout state
  currentWorkout: CurrentWorkout | null;
  warmupReps: number;
  workingReps: number;
  warmupTarget: number;
  targetReps: number;
  workoutHistory: Workout[];
  isJustLiftMode: boolean;
  // Live stats
  liveStats: LiveStats;
  repRanges: import("../lib/types").RepRanges;
  maxPos: number;

  // Auto-stop
  autoStopProgress: number;

  // Actions
  startWorkout: (
    mode: string,
    weightKg: number,
    reps: number,
    isJustLift: boolean,
  ) => void;
  completeWorkout: () => void;
  resetWorkout: () => void;
  handleMonitorSample: (sample: MonitorSample) => void;
  handleRepNotification: (data: Uint8Array) => void;
  viewWorkoutOnGraph: (index: number) => Workout | null;
}

const WARMUP_TARGET_DEFAULT = 3;

export function useWorkout(
  onAutoStop: () => void,
  onWorkoutComplete: () => void,
): UseWorkoutReturn {
  const [currentWorkout, setCurrentWorkout] = useState<CurrentWorkout | null>(
    null,
  );
  const [targetReps, setTargetReps] = useState(0);
  const [isJustLiftMode, setIsJustLiftMode] = useState(false);
  const [maxPos, setMaxPos] = useState(1000);
  const warmupTarget = WARMUP_TARGET_DEFAULT;
  const stopAtTop = false;

  const [liveStats, setLiveStats] = useState<LiveStats>({
    posA: 0,
    posB: 0,
    loadA: 0,
    loadB: 0,
    ticks: 0,
  });

  // --- Sub-hooks ---

  const { workoutHistory, addWorkout, viewWorkoutOnGraph } =
    useWorkoutHistory();

  const { autoStopProgress, checkAutoStop, resetAutoStop } =
    useAutoStop(onAutoStop);

  const {
    warmupReps,
    workingReps,
    currentSampleRef,
    handleRepNotification,
    resetCounters,
  } = useRepCounter({
    currentWorkout,
    warmupTarget,
    targetReps,
    isJustLiftMode,
    stopAtTop,
    recordTopPosition: (...args) => repRangesHook.recordTopPosition(...args),
    recordBottomPosition: (...args) =>
      repRangesHook.recordBottomPosition(...args),
    setCurrentWorkout,
    onAutoStop,
    onWorkoutComplete,
  });

  const repRangesHook = useRepRanges(warmupReps, workingReps, warmupTarget);
  const { repRanges, resetRanges } = repRangesHook;

  // --- Monitor sample handler ---

  const handleMonitorSample = useCallback(
    (sample: MonitorSample) => {
      currentSampleRef.current = sample;

      setLiveStats({
        posA: sample.posA,
        posB: sample.posB,
        loadA: sample.loadA,
        loadB: sample.loadB,
        ticks: sample.ticks,
      });

      // Auto-adjust max position
      const currentMax = Math.max(sample.posA, sample.posB);
      if (currentMax > maxPos) {
        setMaxPos(currentMax + 100);
      }

      // Check auto-stop for Just Lift mode
      if (isJustLiftMode) {
        checkAutoStop(sample, repRanges);
      }
    },
    [maxPos, isJustLiftMode, checkAutoStop, repRanges, currentSampleRef],
  );

  // --- Workout lifecycle ---

  const startWorkout = useCallback(
    (mode: string, weightKg: number, reps: number, isJustLift: boolean) => {
      setCurrentWorkout({
        mode,
        weightKg,
        targetReps: reps,
        startTime: new Date(),
        warmupEndTime: null,
        endTime: null,
      });
      setTargetReps(reps);
      setIsJustLiftMode(isJustLift);

      resetCounters();
      resetRanges();
      resetAutoStop();
    },
    [resetCounters, resetRanges, resetAutoStop],
  );

  const resetWorkout = useCallback(() => {
    setCurrentWorkout(null);
    setTargetReps(0);
    setIsJustLiftMode(false);

    resetCounters();
    resetRanges();
    resetAutoStop();
  }, [resetCounters, resetRanges, resetAutoStop]);

  const completeWorkout = useCallback(() => {
    if (currentWorkout) {
      const endTime = new Date();
      addWorkout({
        mode: currentWorkout.mode,
        weightKg: currentWorkout.weightKg,
        reps: workingReps,
        timestamp: endTime,
        startTime: currentWorkout.startTime,
        warmupEndTime: currentWorkout.warmupEndTime,
        endTime,
      });
    }

    resetWorkout();
  }, [currentWorkout, workingReps, addWorkout, resetWorkout]);

  return {
    currentWorkout,
    warmupReps,
    workingReps,
    warmupTarget,
    targetReps,
    workoutHistory,
    isJustLiftMode,
    liveStats,
    repRanges,
    maxPos,
    autoStopProgress,
    startWorkout,
    completeWorkout,
    resetWorkout,
    handleMonitorSample,
    handleRepNotification,
    viewWorkoutOnGraph,
  };
}
