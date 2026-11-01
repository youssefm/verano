// components/ExercisePage.tsx - The page for doing one exercise, set by set

import type { ReactNode } from "react";
import { useSetAtom } from "jotai";
import type { Exercise, ExerciseProgress, WorkoutConfig } from "../lib/types";
import {
  getCurrentSet,
  getSetNumbers,
  getSetWeight,
  getTargetReps,
  getTotalReps,
  isBurnoutSet,
  isOpenEndedSet,
} from "../lib/sets";
import { describeExercise, formatKg } from "../lib/exerciseLabels";
import { exercisesAtom } from "../lib/atoms";

interface ExercisePageProps {
  exercise: Exercise;
  progress: ExerciseProgress;
  isConnected: boolean;
  /** A set of this exercise is running right now. */
  isRunning: boolean;
  onStart: (config: WorkoutConfig) => void;
  onStop: () => void;
  onSkipBurnout: () => void;
  onBack: () => void;
  livePanel: ReactNode;
  chart: ReactNode;
}

const WEIGHT_STEP_KG = 0.1;

export function ExercisePage({
  exercise,
  progress,
  isConnected,
  isRunning,
  onStart,
  onStop,
  onSkipBurnout,
  onBack,
  livePanel,
  chart,
}: ExercisePageProps) {
  const setExercises = useSetAtom(exercisesAtom);
  const { config } = exercise;
  const currentSet = getCurrentSet(progress);
  const isBurnoutNext = !progress.isDone && isBurnoutSet(currentSet);

  const setWeightLabel = (set: number) =>
    config.type === "echo"
      ? "Echo"
      : formatKg(getSetWeight(config.weight, set));

  const adjustWeight = (delta: number) => {
    if (config.type === "echo") return;
    const weight = Math.max(
      0,
      Math.min(100, +(config.weight + delta).toFixed(1))
    );
    const updated: Exercise = { ...exercise, config: { ...config, weight } };
    setExercises((previous) =>
      previous.map((ex) => (ex.id === updated.id ? updated : ex))
    );
  };

  const handleStart = () => {
    if (config.type === "echo") {
      onStart({
        ...config,
        targetReps: config.isJustLift ? 0 : config.targetReps,
      });
    } else {
      onStart({ ...config, reps: config.isJustLift ? 0 : config.reps });
    }
  };

  // Reps only matter when a set had no fixed target or missed it;
  // otherwise they'd just repeat the exercise's rep target.
  const targetReps = getTargetReps(exercise);

  const setRows = getSetNumbers(exercise).map((set) => {
    const isBurnout = isBurnoutSet(set);
    const completedSet = progress.completedSets[set - 1];
    const isComplete = completedSet !== undefined;
    const isSkipped = isBurnout && progress.skippedBurnout;
    const isCurrent = !progress.isDone && set === currentSet;
    const repsNote = isSkipped
      ? "skipped"
      : isComplete &&
          (isOpenEndedSet(exercise, set) || completedSet.reps !== targetReps)
        ? `${completedSet.reps} reps`
        : null;
    const className = [
      "set-row",
      isBurnout ? "burnout" : "",
      isComplete ? "complete" : "",
      isCurrent ? "current" : "",
      isSkipped ? "skipped" : "",
    ].join(" ");
    return (
      <li key={set} className={className}>
        <span className="set-marker">{isComplete ? "✓" : ""}</span>
        <span className="set-label">
          {isBurnout ? "🔥 Burnout" : `Set ${set}`}
          {repsNote && <span className="set-note">{repsNote}</span>}
        </span>
        <span className="set-weight">
          {/* Finished sets show what was lifted, even if the base changed since */}
          {isComplete && config.type === "program"
            ? formatKg(completedSet.weightKg)
            : setWeightLabel(set)}
        </span>
      </li>
    );
  });

  // Base weight can be tuned whenever no set is running
  const weightAdjuster = config.type === "program" && !isRunning && (
    <div className="weight-adjuster">
      <span>Base weight</span>
      <div className="stepper">
        <button
          onClick={() => adjustWeight(-WEIGHT_STEP_KG)}
          aria-label="Decrease weight"
        >
          −
        </button>
        <span>{formatKg(config.weight)}</span>
        <button
          onClick={() => adjustWeight(WEIGHT_STEP_KG)}
          aria-label="Increase weight"
        >
          +
        </button>
      </div>
    </div>
  );

  let controls: ReactNode;
  if (progress.isDone) {
    controls = (
      <button className="button-primary" onClick={onBack}>
        ← Back to exercises
      </button>
    );
  } else if (isRunning) {
    // Stop stays available while disconnected so a dropped connection
    // can't trap the user on this page.
    controls = (
      <>
        <button className="button-primary button-stop" onClick={onStop}>
          <span className="stop-square" /> Stop
        </button>
        <p className="controls-hint">
          {!isConnected
            ? "Trainer disconnected — stop to end the set"
            : isOpenEndedSet(exercise, currentSet)
              ? "Press Stop when you're done — the set counts"
              : "Stopping early won't count the set"}
        </p>
      </>
    );
  } else if (isBurnoutNext) {
    controls = (
      <>
        <div className="button-pair">
          <button
            className="button-primary button-burnout"
            onClick={handleStart}
            disabled={!isConnected}
          >
            🔥 Burnout · {setWeightLabel(currentSet)}
          </button>
          <button className="button-ghost" onClick={onSkipBurnout}>
            Skip
          </button>
        </div>
        <p className="controls-hint">
          {isConnected
            ? "One open-ended set — lift until you can't, then stop"
            : "Connect the trainer to start"}
        </p>
      </>
    );
  } else {
    controls = (
      <>
        <button
          className="button-primary"
          onClick={handleStart}
          disabled={!isConnected}
        >
          ▶ Start set {currentSet}
          {config.type === "program" && ` · ${setWeightLabel(currentSet)}`}
        </button>
        {!isConnected && (
          <p className="controls-hint">Connect the trainer to start</p>
        )}
      </>
    );
  }

  return (
    <main className="exercise-page">
      <section className="panel set-panel">
        <div>
          <h1>{exercise.name}</h1>
          <p className="exercise-description">{describeExercise(exercise)}</p>
        </div>
        <ol className="set-list">{setRows}</ol>
        <div className="set-controls">
          {weightAdjuster}
          {controls}
        </div>
      </section>

      <div className="exercise-main">
        {progress.isDone ? (
          <section className="panel summary-panel">
            <div className="panel-title">Exercise complete</div>
            <h2>{exercise.name} 🌿</h2>
            <div className="summary-stats">
              <div>
                <b>{progress.completedSets.length}</b>
                <span>sets</span>
              </div>
              <div>
                <b>{getTotalReps(progress)}</b>
                <span>reps</span>
              </div>
              {progress.skippedBurnout && (
                <div>
                  <b>—</b>
                  <span>burnout skipped</span>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="panel live-panel">{livePanel}</section>
        )}
        <section className="panel chart-panel">
          <div className="panel-title">Load</div>
          {chart}
        </section>
      </div>
    </main>
  );
}
