// components/LiveWorkoutPanel.tsx — Meadow-style unified workout display

import type { LiveStats } from "../lib/types";

interface LiveWorkoutPanelProps {
  warmupReps: number;
  workingReps: number;
  warmupTarget: number;
  targetReps: number;
  hasActiveWorkout: boolean;
  currentSet: number;
  totalSets: number;
  liveStats: LiveStats;
  maxPos: number;
  autoStopProgress: number;
  isJustLiftMode: boolean;
}

const PHASE_COLORS = {
  inactive: "#b0b0a8",
  warmup: "#5b9bd5",
  working: "#5eb06a",
  burnout: "#d4a84b",
} as const;

const BADGE_BACKGROUNDS = {
  inactive: "#e8e8e4",
  warmup: "#dde8f5",
  working: "#d8edda",
  burnout: "#f5ead5",
} as const;

type Phase = keyof typeof PHASE_COLORS;

function getPhase(
  hasActiveWorkout: boolean,
  warmupReps: number,
  warmupTarget: number,
  currentSet: number,
  totalSets: number,
): Phase {
  if (!hasActiveWorkout) return "inactive";
  if (warmupReps < warmupTarget) return "warmup";
  if (currentSet > totalSets) return "burnout";
  return "working";
}

function formatLoad(kg: number): string {
  if (isNaN(kg) || kg === 0) return "—";
  return kg.toFixed(1);
}

const ARC_RADIUS = 54;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;

export function LiveWorkoutPanel({
  warmupReps,
  workingReps,
  warmupTarget,
  targetReps,
  hasActiveWorkout,
  currentSet,
  totalSets,
  liveStats,
  maxPos,
  autoStopProgress,
  isJustLiftMode,
}: LiveWorkoutPanelProps) {
  const phase = getPhase(
    hasActiveWorkout,
    warmupReps,
    warmupTarget,
    currentSet,
    totalSets,
  );
  const color = PHASE_COLORS[phase];
  const badgeBg = BADGE_BACKGROUNDS[phase];

  // Rep display
  let label: string;
  let repDisplay: string;
  let reps: number;
  let target: number;

  if (phase === "inactive") {
    label = "Reps";
    repDisplay = "—";
    reps = 0;
    target = 0;
  } else if (phase === "warmup") {
    label = "Warmup";
    repDisplay = `${warmupReps} / ${warmupTarget}`;
    reps = warmupReps;
    target = warmupTarget;
  } else if (phase === "burnout") {
    label = "Burnout";
    repDisplay = `${workingReps}`;
    reps = workingReps;
    target = 0;
  } else {
    label = "Working";
    repDisplay =
      targetReps > 0 ? `${workingReps} / ${targetReps}` : `${workingReps}`;
    reps = workingReps;
    target = targetReps;
  }

  // Set display
  const setDisplay =
    hasActiveWorkout && phase !== "warmup"
      ? currentSet > totalSets
        ? "Burnout"
        : `Set ${currentSet} / ${totalSets}`
      : null;

  // Arc progress
  const progress =
    target > 0 ? Math.min(reps / target, 1) : phase === "inactive" ? 0 : 1;
  const arcOffset = ARC_CIRCUMFERENCE * (1 - progress);

  // Position bars
  const barWidthB = Math.min((liveStats.posB / maxPos) * 100, 100);
  const barWidthA = Math.min((liveStats.posA / maxPos) * 100, 100);
  const totalLoad = liveStats.loadA + liveStats.loadB;

  // Auto-stop (Just Lift mode)
  const showAutoStop = isJustLiftMode && autoStopProgress > 0;

  return (
    <div className="meadow-panel">
      <span className="meadow-badge" style={{ background: badgeBg, color }}>
        {label}
      </span>

      <div className="meadow-arc-wrap">
        <svg viewBox="0 0 120 120">
          <circle className="meadow-arc-bg" cx="60" cy="60" r={ARC_RADIUS} />
          <circle
            className="meadow-arc-fill"
            cx="60"
            cy="60"
            r={ARC_RADIUS}
            stroke={color}
            strokeDasharray={ARC_CIRCUMFERENCE}
            strokeDashoffset={arcOffset}
          />
        </svg>
        <div className="meadow-arc-center">
          <div
            className="meadow-arc-reps"
            style={{ color: phase === "inactive" ? "#bbb" : "#2a3f2a" }}
          >
            {repDisplay}
          </div>
          {setDisplay && <div className="meadow-arc-set">{setDisplay}</div>}
        </div>
      </div>

      {/* Auto-stop countdown (Just Lift mode only) */}
      {showAutoStop && (
        <div className="meadow-autostop">
          <svg viewBox="0 0 40 40" className="meadow-autostop-ring">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#dde6da"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#e05555"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 16}
              strokeDashoffset={
                2 * Math.PI * 16 * (1 - autoStopProgress)
              }
              style={{ transition: "stroke-dashoffset 0.1s linear" }}
            />
          </svg>
          <span className="meadow-autostop-text">
            {Math.ceil((1 - autoStopProgress) * 5)}s
          </span>
        </div>
      )}

      <div className="meadow-meters">
        <div className="meadow-meter-row">
          <span className="meadow-meter-label">Left</span>
          <div className="meadow-meter-track">
            <div
              className="meadow-meter-fill"
              style={{ width: `${barWidthB}%`, background: color }}
            />
          </div>
          <span className="meadow-meter-val">
            {formatLoad(liveStats.loadB)} kg
          </span>
        </div>

        <div className="meadow-meter-row">
          <span className="meadow-meter-label">Right</span>
          <div className="meadow-meter-track">
            <div
              className="meadow-meter-fill"
              style={{ width: `${barWidthA}%`, background: color }}
            />
          </div>
          <span className="meadow-meter-val">
            {formatLoad(liveStats.loadA)} kg
          </span>
        </div>

        <div className="meadow-meter-row">
          <span className="meadow-total-label">Total</span>
          <span className="meadow-total-val">
            {formatLoad(totalLoad)} kg
          </span>
        </div>
      </div>
    </div>
  );
}
