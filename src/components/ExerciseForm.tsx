// components/ExerciseForm.tsx - Full config form for creating new exercises

import { useState } from "react";
import { WorkoutConfig } from "../lib/types";
import { WorkoutConfigFields } from "./WorkoutConfigFields";

interface ExerciseFormProps {
  onSave: (name: string, config: WorkoutConfig) => void;
  onCancel: () => void;
}

export function ExerciseForm({ onSave, onCancel }: ExerciseFormProps) {
  const [name, setName] = useState("");
  const [config, setConfig] = useState<WorkoutConfig>({
    type: "program",
    mode: 0,
    weight: 10,
    reps: 10,
    progression: 0,
    isJustLift: false,
  });
  const [weightStr, setWeightStr] = useState("10.0");

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (config.type === "program") {
      const w = parseFloat(weightStr) || 0;
      onSave(trimmed, { ...config, weight: w } as WorkoutConfig);
    } else {
      onSave(trimmed, config);
    }
  };

  return (
    <div className="exercise-form">
      <div className="exercise-form-title">New Exercise</div>

      <div className="form-group">
        <label htmlFor="exercise-name">Exercise Name:</label>
        <input
          type="text"
          id="exercise-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Incline Bench Press"
          autoFocus
        />
      </div>

      <WorkoutConfigFields
        config={config}
        weightStr={weightStr}
        idPrefix="ex"
        onConfigChange={setConfig}
        onWeightStrChange={setWeightStr}
      />

      <div className="exercise-form-actions">
        <button className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={!name.trim()}>
          Save Exercise
        </button>
      </div>
    </div>
  );
}
