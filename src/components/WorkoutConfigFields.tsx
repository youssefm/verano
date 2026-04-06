// components/WorkoutConfigFields.tsx - Shared form fields for workout configuration

import type { EchoLevelType } from "../lib/modes";
import { WorkoutModeNames, EchoLevel, EchoLevelNames } from "../lib/modes";
import type {
  WorkoutConfig,
  ProgramWorkoutConfig,
  EchoWorkoutConfig,
} from "../lib/types";

interface WorkoutConfigFieldsProps {
  config: WorkoutConfig;
  weightStr: string;
  /** Unique prefix for input ids to avoid collisions when rendered multiple times */
  idPrefix?: string;
  onConfigChange: (config: WorkoutConfig) => void;
  onWeightStrChange: (val: string) => void;
}

export function WorkoutConfigFields({
  config,
  weightStr,
  idPrefix = "",
  onConfigChange,
  onWeightStrChange,
}: WorkoutConfigFieldsProps) {
  const isEcho = config.type === "echo";

  const patchProgram = (update: Partial<ProgramWorkoutConfig>) =>
    onConfigChange({ ...config, ...update } as WorkoutConfig);

  const patchEcho = (update: Partial<EchoWorkoutConfig>) =>
    onConfigChange({ ...config, ...update } as WorkoutConfig);

  const handleModeChange = (val: string) => {
    if (val === "echo") {
      onConfigChange({
        type: "echo",
        level: EchoLevel.HARDER,
        eccentricPct: 100,
        targetReps: 10,
        isJustLift: false,
      });
    } else {
      const weight = parseFloat(weightStr) || 10;
      onConfigChange({
        type: "program",
        mode: parseInt(val) as ProgramWorkoutConfig["mode"],
        weight,
        reps: 10,
        progression: 0,
        isJustLift: false,
      });
    }
  };

  const id = (name: string) => (idPrefix ? `${idPrefix}-${name}` : name);

  return (
    <>
      <div className="form-group">
        <label htmlFor={id("mode")}>
          {config.isJustLift && !isEcho
            ? "Base Mode (for resistance profile):"
            : "Workout Mode:"}
        </label>
        <select
          id={id("mode")}
          value={isEcho ? "echo" : config.mode}
          onChange={(e) => handleModeChange(e.target.value)}
        >
          {Object.entries(WorkoutModeNames).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isEcho ? (
        <>
          <div className="form-group">
            <label htmlFor={id("echoLevel")}>Echo Level:</label>
            <select
              id={id("echoLevel")}
              value={config.level + 1}
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
            <label htmlFor={id("eccentric")}>Eccentric Percentage:</label>
            <input
              type="number"
              id={id("eccentric")}
              value={config.eccentricPct}
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
            <label htmlFor={id("weight")}>Weight per cable (kg):</label>
            <input
              type="number"
              id={id("weight")}
              value={weightStr}
              onChange={(e) => {
                onWeightStrChange(e.target.value);
                const w = parseFloat(e.target.value);
                if (!isNaN(w)) patchProgram({ weight: w });
              }}
              onBlur={() => {
                const w = parseFloat(weightStr) || 0;
                onWeightStrChange(w.toFixed(1));
                patchProgram({ weight: w });
              }}
              min={0}
              max={100}
              step={0.1}
            />
          </div>

          <div className="form-group">
            <label htmlFor={id("progression")}>
              Progression/Regression (kg per rep):
            </label>
            <input
              type="number"
              id={id("progression")}
              value={config.progression}
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

      <div className="form-group">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label htmlFor={id("reps")}>Number of reps:</label>
            <input
              type="number"
              id={id("reps")}
              value={isEcho ? config.targetReps : config.reps}
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
          <div style={{ alignSelf: "end" }}>
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
              <span>Just Lift</span>
            </label>
            <div
              style={{
                fontSize: "0.7em",
                color: "#6c757d",
                lineHeight: 1.3,
              }}
            >
              Unlimited reps, auto-stop at rest
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
