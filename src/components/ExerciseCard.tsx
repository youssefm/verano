// components/ExerciseCard.tsx - Compact exercise card with quick adjust controls

import { useState } from "react";
import type { Exercise, WorkoutConfig } from "../lib/types";
import { ProgramModeNames, EchoLevelNames } from "../lib/modes";
import { TOTAL_SETS, getSetWeight } from "../lib/sets";

interface ExerciseCardProps {
  exercise: Exercise;
  currentSet: number;
  isActive: boolean;
  hasActiveWorkout: boolean;
  onUpdate: (exercise: Exercise) => void;
  onDelete: (id: string) => void;
  onStart: (config: WorkoutConfig, exerciseId: string) => void;
  onStop: () => void;
  isConnected: boolean;
}

export function ExerciseCard({
  exercise,
  currentSet,
  isActive,
  hasActiveWorkout,
  onUpdate,
  onDelete,
  onStart,
  onStop,
  isConnected,
}: ExerciseCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { config } = exercise;
  const isEcho = config.type === "echo";

  const getModeDescription = () => {
    if (isEcho) {
      const parts = [
        `Echo ${EchoLevelNames[config.level]}`,
        `${config.eccentricPct}% ecc`,
      ];
      if (!config.isJustLift) parts.push(`${config.targetReps} reps`);
      if (config.isJustLift) parts.push("Just Lift");
      return parts.join(" · ");
    } else {
      const parts = [ProgramModeNames[config.mode]];
      if (!config.isJustLift) parts.push(`${config.reps} reps`);
      if (config.progression !== 0) {
        parts.push(
          `${config.progression > 0 ? "+" : ""}${config.progression} kg/rep`
        );
      }
      if (config.isJustLift) parts.push("Just Lift");
      return parts.join(" · ");
    }
  };

  const weight = isEcho ? null : config.weight;

  const adjustWeight = (delta: number) => {
    if (isEcho) return;
    const newWeight = Math.max(
      0,
      Math.min(100, +(config.weight + delta).toFixed(1))
    );
    onUpdate({ ...exercise, config: { ...config, weight: newWeight } });
  };

  const effectiveWeight = isEcho
    ? null
    : getSetWeight(config.weight, currentSet);

  const handleStart = () => {
    if (isEcho) {
      onStart(
        { ...config, targetReps: config.isJustLift ? 0 : config.targetReps },
        exercise.id
      );
    } else {
      onStart(
        { ...config, reps: config.isJustLift ? 0 : config.reps },
        exercise.id
      );
    }
  };

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(exercise.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const showWeight = !isEcho;

  return (
    <div className="exercise-card">
      <div className="exercise-header">
        <div className="exercise-name">{exercise.name}</div>
        <button
          className={`exercise-delete ${confirmDelete ? "confirming" : ""}`}
          onClick={handleDeleteClick}
          title={confirmDelete ? "Click again to confirm" : "Delete exercise"}
        >
          {confirmDelete ? "Confirm?" : "✕"}
        </button>
      </div>
      <div className="exercise-mode">
        {getModeDescription()}
        {" · "}
        <span style={{ color: "#868e96" }}>
          Set {currentSet}/{TOTAL_SETS}
          {!isEcho &&
            currentSet > 1 &&
            ` · ${effectiveWeight!.toFixed(1)} kg eff`}
        </span>
      </div>

      {showWeight && (
        <div className="exercise-adjusters">
          <div className="adjuster-row">
            <span className="adjuster-label">Weight</span>
            <div className="adjuster-controls">
              <button className="adj-btn" onClick={() => adjustWeight(-0.1)}>
                −
              </button>
              <span className="adj-value">{weight!.toFixed(1)} kg</span>
              <button className="adj-btn" onClick={() => adjustWeight(0.1)}>
                +
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        className={`exercise-start-btn${isActive ? " active" : ""}`}
        onClick={isActive ? onStop : handleStart}
        disabled={!isConnected || (!isActive && hasActiveWorkout)}
      >
        {isActive ? (
          <>
            <span
              style={{
                display: "inline-block",
                width: "0.6em",
                height: "0.6em",
                background: "currentColor",
                borderRadius: "1px",
                verticalAlign: "middle",
                position: "relative",
                top: "-0.05em",
              }}
            />{" "}
            Stop
          </>
        ) : (
          "▶ Start"
        )}
      </button>
    </div>
  );
}
