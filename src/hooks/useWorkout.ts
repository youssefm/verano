// hooks/useWorkout.ts - Hook for managing workout state

import { useState, useCallback, useRef } from "react";
import { MonitorSample } from "../chart";
import {
  CurrentWorkout,
  Workout,
  PositionRange,
  RepRanges,
  LiveStats,
} from "../types";

export interface UseWorkoutReturn {
  // Workout state
  currentWorkout: CurrentWorkout | null;
  warmupReps: number;
  workingReps: number;
  warmupTarget: number;
  targetReps: number;
  workoutHistory: Workout[];
  isJustLiftMode: boolean;
  stopAtTop: boolean;

  // Live stats
  liveStats: LiveStats;
  repRanges: RepRanges;
  maxPos: number;

  // Auto-stop
  autoStopProgress: number;

  // Actions
  startWorkout: (
    mode: string,
    weightKg: number,
    reps: number,
    isJustLift: boolean
  ) => void;
  completeWorkout: () => void;
  resetWorkout: () => void;
  setStopAtTop: (value: boolean) => void;
  handleMonitorSample: (sample: MonitorSample) => void;
  handleRepNotification: (data: Uint8Array) => void;
  viewWorkoutOnGraph: (index: number) => Workout | null;
}

const WARMUP_TARGET_DEFAULT = 3;
const AUTO_STOP_DURATION = 5000; // 5 seconds
const WINDOW_SIZE_WARMUP = 2;
const WINDOW_SIZE_WORKING = 3;

export function useWorkout(
  addLog: (message: string, type: "info" | "success" | "error") => void,
  onAutoStop: () => void,
  onWorkoutComplete: () => void
): UseWorkoutReturn {
  const [currentWorkout, setCurrentWorkout] = useState<CurrentWorkout | null>(
    null
  );
  const [warmupReps, setWarmupReps] = useState(0);
  const [workingReps, setWorkingReps] = useState(0);
  const [warmupTarget] = useState(WARMUP_TARGET_DEFAULT);
  const [targetReps, setTargetReps] = useState(0);
  const [workoutHistory, setWorkoutHistory] = useState<Workout[]>([]);
  const [isJustLiftMode, setIsJustLiftMode] = useState(false);
  const [stopAtTop, setStopAtTop] = useState(false);
  const [autoStopProgress, setAutoStopProgress] = useState(0);
  const [maxPos, setMaxPos] = useState(1000);

  const [liveStats, setLiveStats] = useState<LiveStats>({
    posA: 0,
    posB: 0,
    loadA: 0,
    loadB: 0,
    ticks: 0,
  });

  const [repRanges, setRepRanges] = useState<RepRanges>({
    minRepPosA: null,
    maxRepPosA: null,
    minRepPosB: null,
    maxRepPosB: null,
    minRepPosARange: null,
    maxRepPosARange: null,
    minRepPosBRange: null,
    maxRepPosBRange: null,
  });

  // Refs for position tracking
  const topPositionsA = useRef<number[]>([]);
  const bottomPositionsA = useRef<number[]>([]);
  const topPositionsB = useRef<number[]>([]);
  const bottomPositionsB = useRef<number[]>([]);
  const lastTopCounter = useRef<number | undefined>(undefined);
  const lastRepCounter = useRef<number | undefined>(undefined);
  const autoStopStartTime = useRef<number | null>(null);
  const currentSampleRef = useRef<MonitorSample | null>(null);

  const getWindowSize = useCallback(() => {
    const totalReps = warmupReps + workingReps;
    return totalReps < warmupTarget ? WINDOW_SIZE_WARMUP : WINDOW_SIZE_WORKING;
  }, [warmupReps, workingReps, warmupTarget]);

  const calculateAverage = (arr: number[]): number | null => {
    if (arr.length === 0) return null;
    const sum = arr.reduce((a, b) => a + b, 0);
    return Math.round(sum / arr.length);
  };

  const calculateRange = (arr: number[]): PositionRange | null => {
    if (arr.length === 0) return null;
    return { min: Math.min(...arr), max: Math.max(...arr) };
  };

  const updateRepRanges = useCallback(() => {
    const newRanges: RepRanges = {
      maxRepPosA: calculateAverage(topPositionsA.current),
      minRepPosA: calculateAverage(bottomPositionsA.current),
      maxRepPosB: calculateAverage(topPositionsB.current),
      minRepPosB: calculateAverage(bottomPositionsB.current),
      maxRepPosARange: calculateRange(topPositionsA.current),
      minRepPosARange: calculateRange(bottomPositionsA.current),
      maxRepPosBRange: calculateRange(topPositionsB.current),
      minRepPosBRange: calculateRange(bottomPositionsB.current),
    };
    setRepRanges(newRanges);
    return newRanges;
  }, []);

  const recordTopPosition = useCallback(
    (posA: number, posB: number) => {
      const windowSize = getWindowSize();
      topPositionsA.current.push(posA);
      topPositionsB.current.push(posB);
      if (topPositionsA.current.length > windowSize)
        topPositionsA.current.shift();
      if (topPositionsB.current.length > windowSize)
        topPositionsB.current.shift();
      updateRepRanges();
    },
    [getWindowSize, updateRepRanges]
  );

  const recordBottomPosition = useCallback(
    (posA: number, posB: number) => {
      const windowSize = getWindowSize();
      bottomPositionsA.current.push(posA);
      bottomPositionsB.current.push(posB);
      if (bottomPositionsA.current.length > windowSize)
        bottomPositionsA.current.shift();
      if (bottomPositionsB.current.length > windowSize)
        bottomPositionsB.current.shift();
      updateRepRanges();
    },
    [getWindowSize, updateRepRanges]
  );

  const checkAutoStop = useCallback(
    (sample: MonitorSample, ranges: RepRanges) => {
      if (!ranges.minRepPosA && !ranges.minRepPosB) {
        setAutoStopProgress(0);
        return;
      }

      const rangeA = (ranges.maxRepPosA || 0) - (ranges.minRepPosA || 0);
      const rangeB = (ranges.maxRepPosB || 0) - (ranges.minRepPosB || 0);
      const minRangeThreshold = 50;
      const checkCableA = rangeA > minRangeThreshold;
      const checkCableB = rangeB > minRangeThreshold;

      if (!checkCableA && !checkCableB) {
        setAutoStopProgress(0);
        return;
      }

      let inDangerZone = false;

      if (checkCableA && ranges.minRepPosA !== null) {
        const thresholdA = ranges.minRepPosA + rangeA * 0.05;
        if (sample.posA <= thresholdA) inDangerZone = true;
      }

      if (checkCableB && ranges.minRepPosB !== null) {
        const thresholdB = ranges.minRepPosB + rangeB * 0.05;
        if (sample.posB <= thresholdB) inDangerZone = true;
      }

      if (inDangerZone) {
        if (autoStopStartTime.current === null) {
          autoStopStartTime.current = Date.now();
          addLog(
            "Near bottom of range, starting auto-stop timer (5s)...",
            "info"
          );
        }

        const elapsed = Date.now() - autoStopStartTime.current;
        const progress = Math.min(elapsed / AUTO_STOP_DURATION, 1.0);
        setAutoStopProgress(progress);

        if (elapsed >= AUTO_STOP_DURATION) {
          addLog("Auto-stop triggered! Finishing workout...", "success");
          onAutoStop();
        }
      } else {
        if (autoStopStartTime.current !== null) {
          addLog("Moved out of danger zone, timer reset", "info");
          autoStopStartTime.current = null;
        }
        setAutoStopProgress(0);
      }
    },
    [addLog, onAutoStop]
  );

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
        setRepRanges((currentRanges) => {
          checkAutoStop(sample, currentRanges);
          return currentRanges;
        });
      }
    },
    [maxPos, isJustLiftMode, checkAutoStop]
  );

  const handleRepNotification = useCallback(
    (data: Uint8Array) => {
      if (data.length < 6) return;

      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      const numU16 = data.length / 2;
      const u16Values: number[] = [];
      for (let i = 0; i < numU16; i++) {
        u16Values.push(view.getUint16(i * 2, true));
      }

      if (u16Values.length < 3) return;

      const topCounter = u16Values[0];
      const completeCounter = u16Values[2];
      const sample = currentSampleRef.current;

      addLog(
        `Rep notification: top=${topCounter}, complete=${completeCounter}, pos=[${
          sample?.posA || "?"
        }, ${sample?.posB || "?"}]`,
        "info"
      );

      if (!sample || !currentWorkout) return;

      // Track top of range
      if (lastTopCounter.current === undefined) {
        lastTopCounter.current = topCounter;
      } else {
        let topDelta = 0;
        if (topCounter >= lastTopCounter.current) {
          topDelta = topCounter - lastTopCounter.current;
        } else {
          topDelta = 0xffff - lastTopCounter.current + topCounter + 1;
        }

        if (topDelta > 0) {
          addLog(
            `TOP detected! Counter: ${lastTopCounter.current} -> ${topCounter}, pos=[${sample.posA}, ${sample.posB}]`,
            "success"
          );
          recordTopPosition(sample.posA, sample.posB);
          lastTopCounter.current = topCounter;

          // Check if we should complete at top of final rep
          if (
            stopAtTop &&
            !isJustLiftMode &&
            targetReps > 0 &&
            workingReps === targetReps - 1
          ) {
            addLog(
              "Reached top of final rep! Auto-completing workout...",
              "success"
            );
            onAutoStop();
            onWorkoutComplete();
          }
        }
      }

      // Track rep complete / bottom of range
      if (lastRepCounter.current === undefined) {
        lastRepCounter.current = completeCounter;
        return;
      }

      let delta = 0;
      if (completeCounter >= lastRepCounter.current) {
        delta = completeCounter - lastRepCounter.current;
      } else {
        delta = 0xffff - lastRepCounter.current + completeCounter + 1;
      }

      if (delta > 0) {
        addLog(
          `BOTTOM detected! Counter: ${lastRepCounter.current} -> ${completeCounter}, pos=[${sample.posA}, ${sample.posB}]`,
          "success"
        );
        recordBottomPosition(sample.posA, sample.posB);

        const totalReps = warmupReps + workingReps + 1;

        if (totalReps <= warmupTarget) {
          setWarmupReps((prev) => {
            const newCount = prev + 1;
            addLog(
              `Warmup rep ${newCount}/${warmupTarget} complete`,
              "success"
            );

            // Record warmup end time
            if (newCount === warmupTarget) {
              setCurrentWorkout((workout) =>
                workout ? { ...workout, warmupEndTime: new Date() } : null
              );
            }
            return newCount;
          });
        } else {
          setWorkingReps((prev) => {
            const newCount = prev + 1;
            if (targetReps > 0) {
              addLog(
                `Working rep ${newCount}/${targetReps} complete`,
                "success"
              );
            } else {
              addLog(`Working rep ${newCount} complete`, "success");
            }

            // Auto-complete when target reached (not for Just Lift, not for stopAtTop)
            if (
              !stopAtTop &&
              !isJustLiftMode &&
              targetReps > 0 &&
              newCount >= targetReps
            ) {
              addLog(
                "Target reps reached! Auto-completing workout...",
                "success"
              );
              onWorkoutComplete();
            }
            return newCount;
          });
        }
      }

      lastRepCounter.current = completeCounter;
    },
    [
      currentWorkout,
      warmupReps,
      workingReps,
      warmupTarget,
      targetReps,
      stopAtTop,
      isJustLiftMode,
      addLog,
      recordTopPosition,
      recordBottomPosition,
      onAutoStop,
      onWorkoutComplete,
    ]
  );

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
      setWarmupReps(0);
      setWorkingReps(0);

      // Reset tracking
      topPositionsA.current = [];
      bottomPositionsA.current = [];
      topPositionsB.current = [];
      bottomPositionsB.current = [];
      lastTopCounter.current = undefined;
      lastRepCounter.current = undefined;
      autoStopStartTime.current = null;
      setAutoStopProgress(0);

      setRepRanges({
        minRepPosA: null,
        maxRepPosA: null,
        minRepPosB: null,
        maxRepPosB: null,
        minRepPosARange: null,
        maxRepPosARange: null,
        minRepPosBRange: null,
        maxRepPosBRange: null,
      });
    },
    []
  );

  const completeWorkout = useCallback(() => {
    if (currentWorkout) {
      const endTime = new Date();
      const completedWorkout: Workout = {
        mode: currentWorkout.mode,
        weightKg: currentWorkout.weightKg,
        reps: workingReps,
        timestamp: endTime,
        startTime: currentWorkout.startTime,
        warmupEndTime: currentWorkout.warmupEndTime,
        endTime,
      };

      setWorkoutHistory((prev) => [completedWorkout, ...prev]);
      addLog("Workout completed and saved to history", "success");
    }

    resetWorkout();
  }, [currentWorkout, workingReps, addLog]);

  const resetWorkout = useCallback(() => {
    setCurrentWorkout(null);
    setWarmupReps(0);
    setWorkingReps(0);
    setTargetReps(0);
    setIsJustLiftMode(false);
    setAutoStopProgress(0);

    topPositionsA.current = [];
    bottomPositionsA.current = [];
    topPositionsB.current = [];
    bottomPositionsB.current = [];
    lastTopCounter.current = undefined;
    lastRepCounter.current = undefined;
    autoStopStartTime.current = null;

    setRepRanges({
      minRepPosA: null,
      maxRepPosA: null,
      minRepPosB: null,
      maxRepPosB: null,
      minRepPosARange: null,
      maxRepPosARange: null,
      minRepPosBRange: null,
      maxRepPosBRange: null,
    });
  }, []);

  const viewWorkoutOnGraph = useCallback(
    (index: number): Workout | null => {
      if (index < 0 || index >= workoutHistory.length) {
        addLog("Invalid workout index", "error");
        return null;
      }
      return workoutHistory[index];
    },
    [workoutHistory, addLog]
  );

  return {
    currentWorkout,
    warmupReps,
    workingReps,
    warmupTarget,
    targetReps,
    workoutHistory,
    isJustLiftMode,
    stopAtTop,
    liveStats,
    repRanges,
    maxPos,
    autoStopProgress,
    startWorkout,
    completeWorkout,
    resetWorkout,
    setStopAtTop,
    handleMonitorSample,
    handleRepNotification,
    viewWorkoutOnGraph,
  };
}
