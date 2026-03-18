// hooks/useRepCounter.ts - Parse rep notifications and count warmup/working reps

import { useState, useCallback, useRef, useEffect } from "react";
import { MonitorSample } from "../lib/chart";
import { CurrentWorkout } from "../lib/types";
import { playRepSound } from "../lib/sound";

export interface UseRepCounterReturn {
  warmupReps: number;
  workingReps: number;
  currentSampleRef: React.MutableRefObject<MonitorSample | null>;
  handleRepNotification: (data: Uint8Array) => void;
  resetCounters: () => void;
  setWorkoutActive: (active: boolean) => void;
}

interface RepCounterDeps {
  warmupTarget: number;
  targetReps: number;
  isJustLiftMode: boolean;
  stopAtTop: boolean;
  recordTopPosition: (posA: number, posB: number) => void;
  recordBottomPosition: (posA: number, posB: number) => void;
  setCurrentWorkout: React.Dispatch<
    React.SetStateAction<CurrentWorkout | null>
  >;
  onAutoStop: () => void;
  onWorkoutComplete: () => void;
}

export function useRepCounter(deps: RepCounterDeps): UseRepCounterReturn {
  const {
    warmupTarget,
    targetReps,
    isJustLiftMode,
    stopAtTop,
    recordTopPosition,
    recordBottomPosition,
    setCurrentWorkout,
    onAutoStop,
    onWorkoutComplete,
  } = deps;

  const [warmupReps, setWarmupReps] = useState(0);
  const [workingReps, setWorkingReps] = useState(0);

  const lastTopCounter = useRef<number | undefined>(undefined);
  const lastRepCounter = useRef<number | undefined>(undefined);
  const currentSampleRef = useRef<MonitorSample | null>(null);

  // Ref for synchronous total-rep tracking (avoids stale closure in branching)
  const totalRepsRef = useRef(0);
  // Ref to track workout active state (avoids stale currentWorkout closure)
  const workoutActiveRef = useRef(false);

  const setWorkoutActive = useCallback((active: boolean) => {
    workoutActiveRef.current = active;
  }, []);

  // Auto-complete when target reached (moved out of state updater)
  useEffect(() => {
    if (
      !stopAtTop &&
      !isJustLiftMode &&
      targetReps > 0 &&
      workingReps >= targetReps
    ) {
      console.log("[SUCCESS] Target reps reached! Auto-completing workout...");
      onWorkoutComplete();
    }
  }, [workingReps, stopAtTop, isJustLiftMode, targetReps, onWorkoutComplete]);

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

      console.log(
        `[INFO] Rep notification: top=${topCounter}, complete=${completeCounter}, pos=[${
          sample?.posA || "?"
        }, ${sample?.posB || "?"}]`,
      );

      if (!sample || !workoutActiveRef.current) return;

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
          console.log(
            `[SUCCESS] TOP detected! Counter: ${lastTopCounter.current} -> ${topCounter}, pos=[${sample.posA}, ${sample.posB}]`,
          );
          recordTopPosition(sample.posA, sample.posB);
          lastTopCounter.current = topCounter;

          // Check if we should complete at top of final rep
          const currentWorkingReps = totalRepsRef.current - warmupTarget;
          if (
            stopAtTop &&
            !isJustLiftMode &&
            targetReps > 0 &&
            currentWorkingReps === targetReps - 1
          ) {
            console.log(
              "[SUCCESS] Reached top of final rep! Auto-completing workout...",
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
        console.log(
          `[SUCCESS] BOTTOM detected! Counter: ${lastRepCounter.current} -> ${completeCounter}, pos=[${sample.posA}, ${sample.posB}]`,
        );
        recordBottomPosition(sample.posA, sample.posB);

        // Use ref for atomic branching — immune to stale closures
        totalRepsRef.current += 1;
        const totalReps = totalRepsRef.current;

        playRepSound();

        if (totalReps <= warmupTarget) {
          setWarmupReps((prev) => {
            const newCount = prev + 1;
            console.log(
              `[SUCCESS] Warmup rep ${newCount}/${warmupTarget} complete`,
            );

            // Record warmup end time
            if (newCount === warmupTarget) {
              setCurrentWorkout((workout) =>
                workout ? { ...workout, warmupEndTime: new Date() } : null,
              );
            }
            return newCount;
          });
        } else {
          setWorkingReps((prev) => {
            const newCount = prev + 1;
            if (targetReps > 0) {
              console.log(
                `[SUCCESS] Working rep ${newCount}/${targetReps} complete`,
              );
            } else {
              console.log(`[SUCCESS] Working rep ${newCount} complete`);
            }
            return newCount;
          });
        }
      }

      lastRepCounter.current = completeCounter;
    },
    [
      warmupTarget,
      targetReps,
      isJustLiftMode,
      stopAtTop,
      recordTopPosition,
      recordBottomPosition,
      setCurrentWorkout,
      onAutoStop,
      onWorkoutComplete,
    ],
  );

  const resetCounters = useCallback(() => {
    setWarmupReps(0);
    setWorkingReps(0);
    totalRepsRef.current = 0;
    lastTopCounter.current = undefined;
    lastRepCounter.current = undefined;
    // Don't null currentSampleRef — it should always reflect the latest position
    // so rep notifications arriving right after start aren't silently dropped
  }, []);

  return {
    warmupReps,
    workingReps,
    currentSampleRef,
    handleRepNotification,
    resetCounters,
    setWorkoutActive,
  };
}
