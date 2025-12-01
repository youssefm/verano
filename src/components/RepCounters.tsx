// components/RepCounters.tsx - Rep counter display

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
  const warmupDisplay = hasActiveWorkout
    ? `${warmupReps}/${warmupTarget}`
    : "-/3";
  const workingDisplay = hasActiveWorkout
    ? targetReps > 0
      ? `${workingReps}/${targetReps}`
      : `${workingReps}`
    : "-/-";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "15px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          background: "#e7f5ff",
          padding: "15px",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "0.9em",
            color: "#1971c2",
            marginBottom: "5px",
            fontWeight: 600,
          }}
        >
          Warmup Reps
        </div>
        <div style={{ fontSize: "2em", fontWeight: 700, color: "#1864ab" }}>
          {warmupDisplay}
        </div>
      </div>
      <div
        style={{
          background: "#d3f9d8",
          padding: "15px",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "0.9em",
            color: "#2f9e44",
            marginBottom: "5px",
            fontWeight: 600,
          }}
        >
          Working Reps
        </div>
        <div style={{ fontSize: "2em", fontWeight: 700, color: "#2b8a3e" }}>
          {workingDisplay}
        </div>
      </div>
    </div>
  );
}
