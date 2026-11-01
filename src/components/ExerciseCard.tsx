// components/ExerciseCard.tsx - Catalog tile for one exercise

import { useEffect, useState } from "react";
import type { Exercise, ExerciseProgress } from "../lib/types";
import {
  getCurrentSet,
  getSetNumbers,
  getTotalReps,
  isBurnoutSet,
} from "../lib/sets";
import { describeSettings, modeName } from "../lib/exerciseLabels";

interface ExerciseCardProps {
  exercise: Exercise;
  progress: ExerciseProgress;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

type ProgressStatus = "done" | "in-progress" | "not-started";

function progressStatus(progress: ExerciseProgress): ProgressStatus {
  if (progress.isDone) return "done";
  return progress.completedSets.length > 0 ? "in-progress" : "not-started";
}

function statusText(progress: ExerciseProgress): string {
  const status = progressStatus(progress);
  if (status === "done") return `✓ Done · ${getTotalReps(progress)} reps`;
  if (status === "not-started") return "Not started";
  const currentSet = getCurrentSet(progress);
  return isBurnoutSet(currentSet) ? "Burnout next" : `Set ${currentSet} next`;
}

export function ExerciseCard({
  exercise,
  progress,
  onOpen,
  onDelete,
}: ExerciseCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { config } = exercise;
  const status = progressStatus(progress);

  useEffect(() => {
    if (!confirmDelete) return;
    const timer = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmDelete]);

  const handleDeleteClick = () => {
    if (confirmDelete) onDelete(exercise.id);
    else setConfirmDelete(true);
  };

  return (
    <div className={`exercise-tile-wrap ${status}`}>
      <button className="exercise-tile" onClick={() => onOpen(exercise.id)}>
        <div className="tile-name">{exercise.name}</div>
        <span className={`mode-tag ${config.type}`}>{modeName(exercise)}</span>
        <div className="tile-description">{describeSettings(exercise)}</div>
        <div className="tile-weight">
          {config.type === "echo" ? (
            <>
              {config.eccentricPct}
              <small>% eccentric</small>
            </>
          ) : (
            <>
              {config.weight.toFixed(1)}
              <small>kg / cable</small>
            </>
          )}
        </div>
        <div className="tile-footer">
          <span className="set-pips" aria-hidden="true">
            {getSetNumbers(exercise).map((set) => (
              <i
                key={set}
                className={[
                  isBurnoutSet(set) ? "burnout" : "",
                  set <= progress.completedSets.length ? "complete" : "",
                ].join(" ")}
              />
            ))}
          </span>
          <span className="tile-status">{statusText(progress)}</span>
        </div>
      </button>
      <button
        className={`tile-delete ${confirmDelete ? "confirming" : ""}`}
        onClick={handleDeleteClick}
        title={confirmDelete ? "Click again to confirm" : "Delete exercise"}
      >
        {confirmDelete ? "Delete?" : "✕"}
      </button>
    </div>
  );
}
