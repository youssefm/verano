// components/WorkoutHistory.tsx - Workout history display

import React from "react";
import { Workout } from "../types";

interface WorkoutHistoryProps {
  workouts: Workout[];
  onViewGraph: (index: number) => void;
}

function formatWeight(kg: number): string {
  if (kg <= 0) {
    return "Adaptive";
  }
  return `${kg.toFixed(1)} kg`;
}

export function WorkoutHistory({ workouts, onViewGraph }: WorkoutHistoryProps) {
  return (
    <div>
      <h3 style={{ color: "#667eea", marginBottom: "10px" }}>
        Workout History
      </h3>
      <div
        style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {workouts.length === 0 ? (
            <div
              style={{
                color: "#6c757d",
                fontSize: "0.9em",
                textAlign: "center",
                padding: "20px",
              }}
            >
              No workouts completed yet
            </div>
          ) : (
            workouts.map((workout, index) => {
              const hasTimingData = workout.startTime && workout.endTime;
              return (
                <div key={index} className="history-item">
                  <div className="history-item-title">{workout.mode}</div>
                  <div className="history-item-details">
                    {formatWeight(workout.weightKg)} • {workout.reps} reps
                  </div>
                  {hasTimingData && (
                    <button
                      className="view-graph-btn"
                      onClick={() => onViewGraph(index)}
                      title="View this workout on the graph"
                    >
                      📊 View Graph
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
