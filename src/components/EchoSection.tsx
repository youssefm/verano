// components/EchoSection.tsx - Echo mode controls

import React, { useState } from "react";
import { EchoLevel, EchoLevelNames, EchoLevelType } from "../modes";

interface EchoSectionProps {
  isConnected: boolean;
  onStartEcho: (
    level: EchoLevelType,
    eccentricPct: number,
    targetReps: number,
    isJustLift: boolean
  ) => void;
}

export function EchoSection({ isConnected, onStartEcho }: EchoSectionProps) {
  const [level, setLevel] = useState<EchoLevelType>(EchoLevel.HARDER);
  const [eccentricPct, setEccentricPct] = useState(100);
  const [targetReps, setTargetReps] = useState(2);
  const [justLiftMode, setJustLiftMode] = useState(false);

  const handleStart = () => {
    onStartEcho(
      level,
      eccentricPct,
      justLiftMode ? 0 : targetReps,
      justLiftMode
    );
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="section">
      <h2>Echo Mode</h2>

      <div className="form-group">
        <label htmlFor="echoLevel">Echo Level:</label>
        <select
          id="echoLevel"
          value={level + 1} // UI uses 1-indexed values
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
        <div style={{ fontSize: "0.75em", color: "#6c757d", marginTop: "5px" }}>
          Maximum: 150%
        </div>
      </div>

      <div
        className="form-group"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        <div>
          <label htmlFor="targetReps">Number of Reps:</label>
          <input
            type="number"
            id="targetReps"
            value={targetReps}
            onChange={(e) => setTargetReps(parseInt(e.target.value))}
            min={0}
            max={30}
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

      <button onClick={handleStart}>Start Echo</button>
    </div>
  );
}
