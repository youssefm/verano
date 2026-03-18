// components/RepCounters.tsx - Unified rep counter display

import React from "react";

interface RepCountersProps {
  warmupReps: number;
  workingReps: number;
  warmupTarget: number;
  targetReps: number;
  hasActiveWorkout: boolean;
}

export function RepCounters({
  warmupReps,
  workingReps,
  warmupTarget,
  targetReps,
  hasActiveWorkout,
}: RepCountersProps) {
  const isWarming = hasActiveWorkout && warmupReps < warmupTarget;
  const isWorking = hasActiveWorkout && warmupReps >= warmupTarget;

  let label: string;
  let display: string;
  let bg: string;
  let labelColor: string;
  let valueColor: string;

  if (!hasActiveWorkout) {
    label = "Reps";
    display = "-/-";
    bg = "#f1f3f5";
    labelColor = "#868e96";
    valueColor = "#495057";
  } else if (isWarming) {
    label = "Warmup";
    display = `${warmupReps}/${warmupTarget}`;
    bg = "#e7f5ff";
    labelColor = "#1971c2";
    valueColor = "#1864ab";
  } else {
    label = "Working";
    display =
      targetReps > 0 ? `${workingReps}/${targetReps}` : `${workingReps}`;
    bg = "#d3f9d8";
    labelColor = "#2f9e44";
    valueColor = "#2b8a3e";
  }

  return (
    <div
      style={{
        background: bg,
        padding: "15px 30px",
        borderRadius: "8px",
        textAlign: "center",
        marginBottom: "20px",
        transition: "background 0.3s ease",
      }}
    >
      <div
        style={{
          fontSize: "0.9em",
          color: labelColor,
          marginBottom: "5px",
          fontWeight: 600,
          transition: "color 0.3s ease",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "2em",
          fontWeight: 700,
          color: valueColor,
          transition: "color 0.3s ease",
        }}
      >
        {display}
      </div>
    </div>
  );
}
