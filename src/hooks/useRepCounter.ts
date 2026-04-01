// hooks/useRepCounter.ts - Parse rep notifications and count warmup/working reps

import { useState, useCallback, useRef, useEffect } from "react";
import { MonitorSample } from "../lib/types";
import { CurrentWorkout } from "../lib/types";
import {
  playRepSound,
  playWorkoutCompleteGong,
  playWorkoutStartFanfare,
} from "../lib/sound";

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

// Monotonic notification counter for ordering/gap detection
let _notifSeq = 0;

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
  // Timestamp of when workout was activated (for relative timing in logs)
  const workoutStartTimeRef = useRef<number>(0);

  const setWorkoutActive = useCallback((active: boolean) => {
    const prev = workoutActiveRef.current;
    workoutActiveRef.current = active;
    if (active) {
      workoutStartTimeRef.current = Date.now();
    }
    console.log(
      `[REP-DEBUG] workoutActive changed: ${prev} -> ${active} | ` +
        `lastTopCounter=${lastTopCounter.current} lastRepCounter=${lastRepCounter.current} ` +
        `totalReps=${totalRepsRef.current}`,
    );
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
      playWorkoutCompleteGong();
      onWorkoutComplete();
    }
  }, [workingReps, stopAtTop, isJustLiftMode, targetReps, onWorkoutComplete]);

  const handleRepNotification = useCallback(
    (data: Uint8Array) => {
      const seq = ++_notifSeq;
      const now = Date.now();
      const tSinceStart = workoutStartTimeRef.current
        ? `+${((now - workoutStartTimeRef.current) / 1000).toFixed(1)}s`
        : "no-workout";

      // Log raw bytes for every notification
      const hex = Array.from(data)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ");
      console.log(
        `[REP-DEBUG] #${seq} raw notification (${data.length} bytes) ${tSinceStart}: ${hex}`,
      );

      if (data.length < 6) {
        console.warn(
          `[REP-DEBUG] #${seq} DROPPED: data too short (${data.length} < 6)`,
        );
        return;
      }

      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      const numU16 = data.length / 2;
      const u16Values: number[] = [];
      for (let i = 0; i < numU16; i++) {
        u16Values.push(view.getUint16(i * 2, true));
      }

      if (u16Values.length < 3) {
        console.warn(
          `[REP-DEBUG] #${seq} DROPPED: fewer than 3 u16 values (got ${u16Values.length})`,
        );
        return;
      }

      const topCounter = u16Values[0];
      const completeCounter = u16Values[2];
      const sample = currentSampleRef.current;

      console.log(
        `[REP-DEBUG] #${seq} ${tSinceStart} parsed: top=${topCounter}, complete=${completeCounter}, ` +
          `allU16=[${u16Values.join(",")}], pos=[${sample?.posA ?? "null"}, ${sample?.posB ?? "null"}], ` +
          `active=${workoutActiveRef.current}, hasSample=${!!sample}`,
      );

      if (!sample) {
        console.warn(`[REP-DEBUG] #${seq} DROPPED: no currentSample yet`);
        return;
      }
      if (!workoutActiveRef.current) {
        console.warn(
          `[REP-DEBUG] #${seq} DROPPED: workoutActive=false ` +
            `(lastTop=${lastTopCounter.current}, lastRep=${lastRepCounter.current}, totalReps=${totalRepsRef.current})`,
        );
        return;
      }

      // Track top of range
      if (lastTopCounter.current === undefined) {
        lastTopCounter.current = topCounter;
        console.log(`[REP-DEBUG] #${seq} TOP baseline set: ${topCounter}`);
      } else {
        let topDelta = 0;
        if (topCounter >= lastTopCounter.current) {
          topDelta = topCounter - lastTopCounter.current;
        } else {
          topDelta = 0xffff - lastTopCounter.current + topCounter + 1;
        }

        console.log(
          `[REP-DEBUG] #${seq} TOP delta=${topDelta} (${lastTopCounter.current} -> ${topCounter})`,
        );

        if (topDelta > 0) {
          if (topDelta > 1) {
            console.warn(
              `[REP-DEBUG] #${seq} TOP delta=${topDelta} > 1 — possible missed notifications!`,
            );
          }
          console.log(
            `[SUCCESS] TOP detected! Counter: ${lastTopCounter.current} -> ${topCounter}, pos=[${sample.posA}, ${sample.posB}]`,
          );
          recordTopPosition(sample.posA, sample.posB);
          lastTopCounter.current = topCounter;

          // Check if we should complete at top of final rep
          const currentWorkingReps = totalRepsRef.current - warmupTarget;
          console.log(
            `[REP-DEBUG] #${seq} stopAtTop check: stopAtTop=${stopAtTop}, isJustLift=${isJustLiftMode}, ` +
              `targetReps=${targetReps}, currentWorkingReps=${currentWorkingReps}, threshold=${targetReps - 1}`,
          );
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
            playWorkoutCompleteGong();
            onWorkoutComplete();
          }
        }
      }

      // Track rep complete / bottom of range
      if (lastRepCounter.current === undefined) {
        lastRepCounter.current = completeCounter;
        console.log(
          `[REP-DEBUG] #${seq} REP baseline set: ${completeCounter} (first notification after reset)`,
        );
        return;
      }

      let delta = 0;
      if (completeCounter >= lastRepCounter.current) {
        delta = completeCounter - lastRepCounter.current;
      } else {
        delta = 0xffff - lastRepCounter.current + completeCounter + 1;
      }

      console.log(
        `[REP-DEBUG] #${seq} REP delta=${delta} (${lastRepCounter.current} -> ${completeCounter}), ` +
          `totalReps=${totalRepsRef.current}, warmupTarget=${warmupTarget}`,
      );

      if (delta > 0) {
        if (delta > 1) {
          console.warn(
            `[REP-DEBUG] #${seq} REP delta=${delta} > 1 — MISSED ${delta - 1} REP(S)! ` +
              `Only counting 1. Counter jumped ${lastRepCounter.current} -> ${completeCounter}`,
          );
        }
        if (delta > 100) {
          console.error(
            `[REP-DEBUG] #${seq} REP delta=${delta} is suspiciously large — likely counter reset/wrap. ` +
              `IGNORING. lastRepCounter=${lastRepCounter.current}, completeCounter=${completeCounter}`,
          );
          lastRepCounter.current = completeCounter;
          return;
        }

        console.log(
          `[SUCCESS] BOTTOM detected! Counter: ${lastRepCounter.current} -> ${completeCounter}, pos=[${sample.posA}, ${sample.posB}]`,
        );
        recordBottomPosition(sample.posA, sample.posB);

        // Use ref for atomic branching — immune to stale closures
        totalRepsRef.current += 1;
        const totalReps = totalRepsRef.current;

        const isWarmup = totalReps <= warmupTarget;
        const isLastWarmup = isWarmup && totalReps === warmupTarget;
        // Non-stopAtTop completion (with gong) fires reactively from the useEffect
        const willComplete =
          !isWarmup &&
          !stopAtTop &&
          !isJustLiftMode &&
          targetReps > 0 &&
          totalReps - warmupTarget >= targetReps;

        console.log(
          `[REP-DEBUG] #${seq} totalReps now=${totalReps}, warmupTarget=${warmupTarget}, ` +
            `branch=${isWarmup ? "WARMUP" : "WORKING"}`,
        );

        // Play exactly one sound per rep: fanfare for workout start,
        // gong for completion (from useEffect), or normal rep sound
        if (isLastWarmup) {
          playWorkoutStartFanfare();
        } else if (!willComplete) {
          playRepSound();
        }

        if (isWarmup) {
          setWarmupReps((prev) => {
            const newCount = prev + 1;
            console.log(
              `[SUCCESS] Warmup rep ${newCount}/${warmupTarget} complete ` +
                `(totalReps=${totalReps}, prev=${prev})`,
            );
            if (isLastWarmup) {
              console.log(
                `[REP-DEBUG] #${seq} Warmup phase complete, recording warmupEndTime`,
              );
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
                `[SUCCESS] Working rep ${newCount}/${targetReps} complete ` +
                  `(totalReps=${totalReps}, prev=${prev})`,
              );
            } else {
              console.log(
                `[SUCCESS] Working rep ${newCount} complete (totalReps=${totalReps}, prev=${prev})`,
              );
            }
            return newCount;
          });
        }
      } else {
        console.log(
          `[REP-DEBUG] #${seq} delta=0, no rep counted (counter unchanged at ${completeCounter})`,
        );
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
    console.log(
      `[REP-DEBUG] resetCounters called. Previous state: ` +
        `warmupReps=<state>, workingReps=<state>, totalReps=${totalRepsRef.current}, ` +
        `lastTopCounter=${lastTopCounter.current}, lastRepCounter=${lastRepCounter.current}, ` +
        `workoutActive=${workoutActiveRef.current}, currentSample=${!!currentSampleRef.current}`,
    );
    setWarmupReps(0);
    setWorkingReps(0);
    totalRepsRef.current = 0;
    lastTopCounter.current = undefined;
    lastRepCounter.current = undefined;
    // Don't null currentSampleRef — it should always reflect the latest position
    // so rep notifications arriving right after start aren't silently dropped
    console.log(
      `[REP-DEBUG] resetCounters complete. All counters zeroed, refs set to undefined.`,
    );
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
