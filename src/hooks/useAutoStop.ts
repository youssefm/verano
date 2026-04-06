// hooks/useAutoStop.ts - Auto-stop timer when user stays at bottom of range

import { useState, useCallback, useRef } from "react";
import type { MonitorSample } from "../lib/types";
import type { RepRanges } from "../lib/types";

const AUTO_STOP_DURATION = 5000; // 5 seconds

export interface UseAutoStopReturn {
  autoStopProgress: number;
  checkAutoStop: (sample: MonitorSample, ranges: RepRanges) => void;
  resetAutoStop: () => void;
}

export function useAutoStop(onAutoStop: () => void): UseAutoStopReturn {
  const [autoStopProgress, setAutoStopProgress] = useState(0);
  const autoStopStartTime = useRef<number | null>(null);

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
          console.log(
            "[INFO] Near bottom of range, starting auto-stop timer (5s)..."
          );
        }

        const elapsed = Date.now() - autoStopStartTime.current;
        const progress = Math.min(elapsed / AUTO_STOP_DURATION, 1.0);
        setAutoStopProgress(progress);

        if (elapsed >= AUTO_STOP_DURATION) {
          console.log("[SUCCESS] Auto-stop triggered! Finishing workout...");
          onAutoStop();
        }
      } else {
        if (autoStopStartTime.current !== null) {
          console.log("[INFO] Moved out of danger zone, timer reset");
          autoStopStartTime.current = null;
        }
        setAutoStopProgress(0);
      }
    },
    [onAutoStop]
  );

  const resetAutoStop = useCallback(() => {
    autoStopStartTime.current = null;
    setAutoStopProgress(0);
  }, []);

  return { autoStopProgress, checkAutoStop, resetAutoStop };
}
