// hooks/useRepCounter.ts - Parse rep notifications and count warmup/working reps

import { useState, useCallback, useRef } from "react";
import { MonitorSample } from "../lib/chart";
import { CurrentWorkout } from "../lib/types";

export interface UseRepCounterReturn {
  warmupReps: number;
  workingReps: number;
  currentSampleRef: React.MutableRefObject<MonitorSample | null>;
  handleRepNotification: (data: Uint8Array) => void;
  resetCounters: () => void;
}

interface RepCounterDeps {
  currentWorkout: CurrentWorkout | null;
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
    currentWorkout,
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
          console.log(
            `[SUCCESS] TOP detected! Counter: ${lastTopCounter.current} -> ${topCounter}, pos=[${sample.posA}, ${sample.posB}]`,
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

        const totalReps = warmupReps + workingReps + 1;

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

            // Auto-complete when target reached (not for Just Lift, not for stopAtTop)
            if (
              !stopAtTop &&
              !isJustLiftMode &&
              targetReps > 0 &&
              newCount >= targetReps
            ) {
              console.log(
                "[SUCCESS] Target reps reached! Auto-completing workout...",
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
    lastTopCounter.current = undefined;
    lastRepCounter.current = undefined;
    currentSampleRef.current = null;
  }, []);

  return {
    warmupReps,
    workingReps,
    currentSampleRef,
    handleRepNotification,
    resetCounters,
  };
}
