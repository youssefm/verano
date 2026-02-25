// components/WorkoutSection.tsx - Unified workout controls

import React, { useState } from "react";
import {
  WorkoutMode,
  WorkoutModeNames,
  WorkoutModeType,
  EchoLevel,
  EchoLevelNames,
  EchoLevelType,
} from "../lib/modes";
import { WorkoutConfig } from "../lib/types";

interface WorkoutSectionProps {
  isConnected: boolean;
  onStartWorkout: (config: WorkoutConfig) => void;
}

export function WorkoutSection({
  isConnected,
  onStartWorkout,
}: WorkoutSectionProps) {
  const [mode, setMode] = useState<WorkoutModeType>(WorkoutMode.OLD_SCHOOL);
  const isEcho = mode === WorkoutMode.ECHO;

  // Shared
  const [reps, setReps] = useState(10);
  const [justLiftMode, setJustLiftMode] = useState(false);

  // Program fields
  const [weightStr, setWeightStr] = useState("10.0");
  const weight = parseFloat(weightStr) || 0;
  const [progression, setProgression] = useState(0);

  // Echo fields
  const [level, setLevel] = useState<EchoLevelType>(EchoLevel.HARDER);
  const [eccentricPct, setEccentricPct] = useState(100);

  const effectiveReps = justLiftMode ? 0 : reps;

  const handleStart = () => {
    if (isEcho) {
      onStartWorkout({
        type: "echo",
        level,
        eccentricPct,
        targetReps: effectiveReps,
        isJustLift: justLiftMode,
      });
    } else {
      onStartWorkout({
        type: "program",
        mode,
        weight,
        reps: effectiveReps,
        progression,
        isJustLift: justLiftMode,
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
          {justLiftMode && !isEcho
            ? "Base Mode (for resistance profile):"
            : "Workout Mode:"}
        </label>
        <select
          id="mode"
          value={mode}
          onChange={(e) => {
            const val = e.target.value;
            setMode(
              val === "echo"
                ? WorkoutMode.ECHO
                : (parseInt(val) as WorkoutModeType),
            );
          }}
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
              value={level + 1}
              onChange={(e) =>
                setLevel((parseInt(e.target.value) - 1) as EchoLevelType)
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
              value={eccentricPct}
              onChange={(e) => setEccentricPct(parseInt(e.target.value))}
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
              onChange={(e) => setWeightStr(e.target.value)}
              onBlur={() => setWeightStr(weight.toFixed(1))}
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
              value={progression}
              onChange={(e) => setProgression(parseFloat(e.target.value))}
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
            value={reps}
            onChange={(e) => setReps(parseInt(e.target.value))}
            min={isEcho ? 0 : 1}
            max={isEcho ? 30 : 100}
            disabled={justLiftMode}
            style={{ opacity: justLiftMode ? 0.5 : 1 }}
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
              checked={justLiftMode}
              onChange={(e) => setJustLiftMode(e.target.checked)}
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
