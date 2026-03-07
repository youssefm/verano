// components/Sidebar.tsx - Sidebar component with exercise management

import React, { useState } from "react";
import { useAtom } from "jotai";
import { ConnectionSection } from "./ConnectionSection";
import { ExerciseCard } from "./ExerciseCard";
import { ExerciseForm } from "./ExerciseForm";
import { WorkoutConfig, Exercise } from "../lib/types";
import { exercisesAtom } from "../lib/atoms";

interface SidebarProps {
  isOpen: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onStartWorkout: (config: WorkoutConfig) => void;
}

export function Sidebar({
  isOpen,
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
  onStartWorkout,
}: SidebarProps) {
  const [exercises, setExercises] = useAtom(exercisesAtom);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateExercise = (name: string, config: WorkoutConfig) => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name,
      config,
    };
    setExercises((prev) => [...prev, newExercise]);
    setIsCreating(false);
  };

  const handleUpdateExercise = (updated: Exercise) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === updated.id ? updated : ex)),
    );
  };

  const handleDeleteExercise = (id: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <h1>Verano</h1>
        <p>Web Bluetooth Interface</p>
      </div>

      <div className="sidebar-content">
        <ConnectionSection
          isConnected={isConnected}
          isConnecting={isConnecting}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />

        <div className="section">
          <h2>Exercises</h2>

          {exercises.length === 0 && !isCreating && (
            <p className="exercise-empty">
              No exercises yet. Create one to get started.
            </p>
          )}

          {exercises.length > 0 && (
            <div className="exercise-list">
              {exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onUpdate={handleUpdateExercise}
                  onDelete={handleDeleteExercise}
                  onStart={onStartWorkout}
                  isConnected={isConnected}
                />
              ))}
            </div>
          )}

          {isCreating ? (
            <ExerciseForm
              onSave={handleCreateExercise}
              onCancel={() => setIsCreating(false)}
            />
          ) : (
            <button
              className="new-exercise-btn"
              onClick={() => setIsCreating(true)}
              style={{ marginTop: exercises.length > 0 ? "12px" : "0" }}
            >
              + New Exercise
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
