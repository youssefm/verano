// components/ProgramSection.tsx - Program mode controls

import React, { useState } from "react";
import { ProgramMode, ProgramModeNames, ProgramModeType } from "../modes";

interface ProgramSectionProps {
  isConnected: boolean;
  onStartProgram: (
    mode: ProgramModeType,
    weight: number,
    reps: number,
    progression: number,
    isJustLift: boolean
  ) => void;
}

export function ProgramSection({
  isConnected,
  onStartProgram,
}: ProgramSectionProps) {
  const [mode, setMode] = useState<ProgramModeType>(ProgramMode.OLD_SCHOOL);
  const [weight, setWeight] = useState(10);
  const [reps, setReps] = useState(10);
  const [progression, setProgression] = useState(0);
  const [justLiftMode, setJustLiftMode] = useState(false);

  const handleStart = () => {
    onStartProgram(
      mode,
      weight,
      justLiftMode ? 0 : reps,
      progression,
      justLiftMode
    );
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="section">
      <h2>Program Mode</h2>

      <div className="form-group">
        <label htmlFor="mode">
          {justLiftMode
            ? "Base Mode (for resistance profile):"
            : "Workout Mode:"}
        </label>
        <select
          id="mode"
          value={mode}
          onChange={(e) => setMode(parseInt(e.target.value) as ProgramModeType)}
        >
          <option value={ProgramMode.OLD_SCHOOL}>
            {ProgramModeNames[ProgramMode.OLD_SCHOOL]}
          </option>
          <option value={ProgramMode.PUMP}>
            {ProgramModeNames[ProgramMode.PUMP]}
          </option>
          <option value={ProgramMode.TUT}>
            {ProgramModeNames[ProgramMode.TUT]}
          </option>
          <option value={ProgramMode.TUT_BEAST}>
            {ProgramModeNames[ProgramMode.TUT_BEAST]}
          </option>
          <option value={ProgramMode.ECCENTRIC_ONLY}>
            {ProgramModeNames[ProgramMode.ECCENTRIC_ONLY]}
          </option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="weight">Weight per cable (kg):</label>
        <input
          type="number"
          id="weight"
          value={weight}
          onChange={(e) => setWeight(parseFloat(e.target.value))}
          min={0}
          max={100}
          step={0.5}
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
        <div style={{ fontSize: "0.75em", color: "#6c757d", marginTop: "5px" }}>
          +3 to -3 kg
        </div>
      </div>

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
            min={1}
            max={100}
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

      <button onClick={handleStart}>Start Program</button>
    </div>
  );
}
