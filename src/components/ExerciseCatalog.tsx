// components/ExerciseCatalog.tsx - Exercise catalog page (pick one to start)

import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { ExerciseCard } from "./ExerciseCard";
import { ExerciseForm } from "./ExerciseForm";
import type { WorkoutConfig, Exercise, ExerciseProgress } from "../lib/types";
import { exercisesAtom } from "../lib/atoms";

interface NewExerciseDialogProps {
  onSave: (name: string, config: WorkoutConfig) => void;
  onCancel: () => void;
}

/** Modal for creating an exercise (Escape cancels; backdrop clicks don't, so typing isn't lost). */
function NewExerciseDialog({ onSave, onCancel }: NewExerciseDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="exercise-dialog"
      aria-label="New exercise"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <ExerciseForm onSave={onSave} onCancel={onCancel} />
    </dialog>
  );
}

interface ExerciseCatalogProps {
  getProgress: (exerciseId: string) => ExerciseProgress;
  onOpenExercise: (exerciseId: string) => void;
}

export function ExerciseCatalog({
  getProgress,
  onOpenExercise,
}: ExerciseCatalogProps) {
  const [exercises, setExercises] = useAtom(exercisesAtom);
  const [isCreating, setIsCreating] = useState(false);
  const doneCount = exercises.filter((ex) => getProgress(ex.id).isDone).length;

  const handleCreateExercise = (name: string, config: WorkoutConfig) => {
    const newExercise: Exercise = { id: crypto.randomUUID(), name, config };
    setExercises((prev) => [...prev, newExercise]);
    setIsCreating(false);
  };

  const handleDeleteExercise = (id: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  return (
    <main className="catalog-page">
      <div className="catalog-inner">
        <div className="page-heading">
          <div>
            <h1>Exercises</h1>
            {exercises.length > 0 && (
              <p>
                {doneCount} of {exercises.length} done this session
              </p>
            )}
          </div>
          <button
            className="button-primary"
            onClick={() => setIsCreating(true)}
          >
            + New exercise
          </button>
        </div>

        {exercises.length === 0 && !isCreating && (
          <div className="catalog-empty">
            <p>No exercises yet. Create one to get started.</p>
          </div>
        )}

        <div className="catalog-grid">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              progress={getProgress(exercise.id)}
              onOpen={onOpenExercise}
              onDelete={handleDeleteExercise}
            />
          ))}
        </div>
      </div>
      {isCreating && (
        <NewExerciseDialog
          onSave={handleCreateExercise}
          onCancel={() => setIsCreating(false)}
        />
      )}
    </main>
  );
}
