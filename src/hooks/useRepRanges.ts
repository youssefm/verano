// hooks/useRepRanges.ts - Track rep position ranges (top/bottom of each cable)

import { useState, useCallback, useRef } from "react";
import type { PositionRange, RepRanges } from "../lib/types";

const WINDOW_SIZE_WARMUP = 2;
const WINDOW_SIZE_WORKING = 3;

export interface UseRepRangesReturn {
  repRanges: RepRanges;
  recordTopPosition: (posA: number, posB: number) => void;
  recordBottomPosition: (posA: number, posB: number) => void;
  resetRanges: () => void;
}

const emptyRanges: RepRanges = {
  minRepPosA: null,
  maxRepPosA: null,
  minRepPosB: null,
  maxRepPosB: null,
  minRepPosARange: null,
  maxRepPosARange: null,
  minRepPosBRange: null,
  maxRepPosBRange: null,
};

function calculateAverage(arr: number[]): number | null {
  if (arr.length === 0) return null;
  const sum = arr.reduce((a, b) => a + b, 0);
  return Math.round(sum / arr.length);
}

function calculateRange(arr: number[]): PositionRange | null {
  if (arr.length === 0) return null;
  return { min: Math.min(...arr), max: Math.max(...arr) };
}

export function useRepRanges(
  warmupReps: number,
  workingReps: number,
  warmupTarget: number
): UseRepRangesReturn {
  const [repRanges, setRepRanges] = useState<RepRanges>(emptyRanges);

  const topPositionsA = useRef<number[]>([]);
  const bottomPositionsA = useRef<number[]>([]);
  const topPositionsB = useRef<number[]>([]);
  const bottomPositionsB = useRef<number[]>([]);

  const getWindowSize = useCallback(() => {
    const totalReps = warmupReps + workingReps;
    return totalReps < warmupTarget ? WINDOW_SIZE_WARMUP : WINDOW_SIZE_WORKING;
  }, [warmupReps, workingReps, warmupTarget]);

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

  const resetRanges = useCallback(() => {
    topPositionsA.current = [];
    bottomPositionsA.current = [];
    topPositionsB.current = [];
    bottomPositionsB.current = [];
    setRepRanges(emptyRanges);
  }, []);

  return {
    repRanges,
    recordTopPosition,
    recordBottomPosition,
    resetRanges,
  };
}
