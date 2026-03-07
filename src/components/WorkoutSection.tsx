// components/WorkoutSection.tsx - Unified workout controls

import React, { useState } from "react";
import { useAtom } from "jotai";
import {
  WorkoutMode,
  WorkoutModeNames,
  WorkoutModeType,
  EchoLevel,
  EchoLevelNames,
  EchoLevelType,
} from "../lib/modes";
import {
  WorkoutConfig,
  ProgramWorkoutConfig,
  EchoWorkoutConfig,
} from "../lib/types";
import { workoutConfigAtom } from "../lib/atoms";

interface WorkoutSectionProps {
  isConnected: boolean;
  onStartWorkout: (config: WorkoutConfig) => void;
}

export function WorkoutSection({
  isConnected,
  onStartWorkout,
}: WorkoutSectionProps) {
  const [config, setConfig] = useAtom(workoutConfigAtom);
  const isEcho = config.type === "echo";

  // weightStr is local UI state for the number input
  const [weightStr, setWeightStr] = useState(() =>
    isEcho ? "10.0" : (config as ProgramWorkoutConfig).weight.toFixed(1),
  );

  const handleModeChange = (val: string) => {
    if (val === "echo") {
      setConfig({
        type: "echo",
        level: EchoLevel.HARDER,
        eccentricPct: 100,
        targetReps: 10,
        isJustLift: false,
      });
    } else {
      const weight = parseFloat(weightStr) || 10;
      setConfig({
        type: "program",
        mode: parseInt(val) as ProgramWorkoutConfig["mode"],
        weight,
        reps: 10,
        progression: 0,
        isJustLift: false,
      });
    }
  };

  const patchProgram = (update: Partial<ProgramWorkoutConfig>) =>
    setConfig((prev) => ({ ...prev, ...update }) as WorkoutConfig);

  const patchEcho = (update: Partial<EchoWorkoutConfig>) =>
    setConfig((prev) => ({ ...prev, ...update }) as WorkoutConfig);

  const handleStart = () => {
    if (isEcho) {
      const c = config as EchoWorkoutConfig;
      onStartWorkout({
        ...c,
        targetReps: c.isJustLift ? 0 : c.targetReps,
      });
    } else {
      const c = config as ProgramWorkoutConfig;
      onStartWorkout({
        ...c,
        weight: parseFloat(weightStr) || 0,
        reps: c.isJustLift ? 0 : c.reps,
      });
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="section">
      <h2>Workout</h2>

      <div className="form-group">
        <label htmlFor="mode">
          {config.isJustLift && !isEcho
            ? "Base Mode (for resistance profile):"
            : "Workout Mode:"}
        </label>
        <select
          id="mode"
          value={isEcho ? "echo" : (config as ProgramWorkoutConfig).mode}
          onChange={(e) => handleModeChange(e.target.value)}
        >
          {Object.entries(WorkoutModeNames).map(([value, name]) => (
            <option key={value} value={value}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {isEcho ? (
        <>
          <div className="form-group">
            <label htmlFor="echoLevel">Echo Level:</label>
            <select
              id="echoLevel"
              value={(config as EchoWorkoutConfig).level + 1}
              onChange={(e) =>
                patchEcho({
                  level: (parseInt(e.target.value) - 1) as EchoLevelType,
                })
              }
            >
              <option value={1}>{EchoLevelNames[EchoLevel.HARD]}</option>
              <option value={2}>{EchoLevelNames[EchoLevel.HARDER]}</option>
              <option value={3}>{EchoLevelNames[EchoLevel.HARDEST]}</option>
              <option value={4}>{EchoLevelNames[EchoLevel.EPIC]}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="eccentric">Eccentric Percentage:</label>
            <input
              type="number"
              id="eccentric"
              value={(config as EchoWorkoutConfig).eccentricPct}
              onChange={(e) =>
                patchEcho({ eccentricPct: parseInt(e.target.value) })
              }
              min={0}
              max={150}
              step={5}
            />
            <div
              style={{ fontSize: "0.75em", color: "#6c757d", marginTop: "5px" }}
            >
              Maximum: 150%
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="form-group">
            <label htmlFor="weight">Weight per cable (kg):</label>
            <input
              type="number"
              id="weight"
              value={weightStr}
              onChange={(e) => {
                setWeightStr(e.target.value);
                const w = parseFloat(e.target.value);
                if (!isNaN(w)) patchProgram({ weight: w });
              }}
              onBlur={() => {
                const w = parseFloat(weightStr) || 0;
                setWeightStr(w.toFixed(1));
                patchProgram({ weight: w });
              }}
              min={0}
              max={100}
              step={0.1}
            />
          </div>

          <div className="form-group">
            <label htmlFor="progression">
              Progression/Regression (kg per rep):
            </label>
            <input
              type="number"
              id="progression"
              value={(config as ProgramWorkoutConfig).progression}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) patchProgram({ progression: v });
              }}
              min={-3}
              max={3}
              step={0.1}
            />
            <div
              style={{ fontSize: "0.75em", color: "#6c757d", marginTop: "5px" }}
            >
              +3 to -3 kg
            </div>
          </div>
        </>
      )}

      <div
        className="form-group"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        <div>
          <label htmlFor="reps">Number of reps:</label>
          <input
            type="number"
            id="reps"
            value={
              isEcho
                ? (config as EchoWorkoutConfig).targetReps
                : (config as ProgramWorkoutConfig).reps
            }
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (isEcho) patchEcho({ targetReps: v });
              else patchProgram({ reps: v });
            }}
            min={isEcho ? 0 : 1}
            max={isEcho ? 30 : 100}
            disabled={config.isJustLift}
            style={{ opacity: config.isJustLift ? 0.5 : 1 }}
          />
        </div>
        <div style={{ alignSelf: "center" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "5px",
            }}
          >
            <input
              type="checkbox"
              checked={config.isJustLift}
              onChange={(e) =>
                isEcho
                  ? patchEcho({ isJustLift: e.target.checked })
                  : patchProgram({ isJustLift: e.target.checked })
              }
              style={{ width: "auto" }}
            />
            <span>Just Lift Mode</span>
          </label>
          <div
            style={{
              fontSize: "0.75em",
              color: "#6c757d",
              marginTop: 0,
              lineHeight: 1.3,
            }}
          >
            Unlimited reps with auto-stop after 5s at rest
          </div>
        </div>
      </div>

      <button onClick={handleStart}>Start Workout</button>
    </div>
  );
}
