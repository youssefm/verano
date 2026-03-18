// components/PositionBars.tsx - Cable position visualizer

import React from "react";
import { LiveStats, RepRanges } from "../lib/types";

interface PositionBarsProps {
  liveStats: LiveStats;
  repRanges: RepRanges;
  maxPos: number;
  autoStopProgress: number;
  isJustLiftMode: boolean;
  hasActiveWorkout: boolean;
  isConnected: boolean;
}

export function PositionBars({
  liveStats,
  repRanges,
  maxPos,
  autoStopProgress,
  isJustLiftMode,
  hasActiveWorkout,
  isConnected,
}: PositionBarsProps) {
  const heightA = Math.min((liveStats.posA / maxPos) * 100, 100);
  const heightB = Math.min((liveStats.posB / maxPos) * 100, 100);

  const renderRangeIndicators = (cable: "A" | "B") => {
    const minPos = cable === "A" ? repRanges.minRepPosA : repRanges.minRepPosB;
    const maxRepPos =
      cable === "A" ? repRanges.maxRepPosA : repRanges.maxRepPosB;
    const minRange =
      cable === "A" ? repRanges.minRepPosARange : repRanges.minRepPosBRange;
    const maxRange =
      cable === "A" ? repRanges.maxRepPosARange : repRanges.maxRepPosBRange;

    if (minPos === null || maxRepPos === null) {
      return null;
    }

    const minPct = Math.min((minPos / maxPos) * 100, 100);
    const maxPct = Math.min((maxRepPos / maxPos) * 100, 100);

    return (
      <>
        {/* Min range band */}
        {minRange && (
          <div
            className="range-band min visible"
            style={{
              bottom: `${(minRange.min / maxPos) * 100}%`,
              height: `${((minRange.max - minRange.min) / maxPos) * 100}%`,
            }}
          />
        )}
        {/* Min range line */}
        <div
          className="range-line min visible"
          style={{ bottom: `${minPct}%` }}
        />
        {/* Max range band */}
        {maxRange && (
          <div
            className="range-band max visible"
            style={{
              bottom: `${(maxRange.min / maxPos) * 100}%`,
              height: `${((maxRange.max - maxRange.min) / maxPos) * 100}%`,
            }}
          />
        )}
        {/* Max range line */}
        <div
          className="range-line max visible"
          style={{ bottom: `${maxPct}%` }}
        />
      </>
    );
  };

  const totalLoad = liveStats.loadA + liveStats.loadB;

  const formatLoad = (kg: number) => (isNaN(kg) ? "-" : kg.toFixed(1));

  return (
    <div className="position-bars">
      {/* Left Cable (B) */}
      <div className="bar-container">
        <div className="bar-label">Left Cable</div>
        <div className="bar-wrapper" id="barWrapperB">
          <div className="bar" style={{ height: `${heightB}%` }} />
          {renderRangeIndicators("B")}
        </div>
        <div className="bar-value">{liveStats.posB}</div>
        <div className="bar-load">
          {formatLoad(liveStats.loadB)}{" "}
          <span className="bar-load-unit">kg</span>
        </div>
      </div>

      {/* Center: Auto-stop timer, Total load */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "15px",
        }}
      >
        {/* Auto-stop timer (Just Lift mode only) */}
        {isJustLiftMode && (
          <div style={{ textAlign: "center", height: "80px" }}>
            <svg
              width="80"
              height="80"
              style={{
                transform: "rotate(-90deg)",
                filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))",
              }}
            >
              <circle
                cx="40"
                cy="40"
                r="35"
                fill="none"
                stroke="#e9ecef"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="35"
                fill="none"
                stroke="#ff6b6b"
                strokeWidth="6"
                strokeDasharray="220"
                strokeDashoffset={220 - autoStopProgress * 220}
                style={{ transition: "stroke-dashoffset 0.1s linear" }}
              />
            </svg>
            <div
              style={{
                marginTop: "-54px",
                fontSize: autoStopProgress > 0 ? "1.5em" : "0.75em",
                color: autoStopProgress > 0 ? "#dc3545" : "#6c757d",
                fontWeight: 600,
                pointerEvents: "none",
              }}
            >
              {autoStopProgress > 0
                ? `${Math.ceil((1 - autoStopProgress) * 5)}s`
                : "Auto-Stop"}
            </div>
          </div>
        )}

        <div className="bar-total-load">
          <div className="bar-total-load-label">Total</div>
          <div className="bar-total-load-value">
            {formatLoad(totalLoad)} <span className="bar-load-unit">kg</span>
          </div>
        </div>
      </div>

      {/* Right Cable (A) */}
      <div className="bar-container">
        <div className="bar-label">Right Cable</div>
        <div className="bar-wrapper" id="barWrapperA">
          <div className="bar" style={{ height: `${heightA}%` }} />
          {renderRangeIndicators("A")}
        </div>
        <div className="bar-value">{liveStats.posA}</div>
        <div className="bar-load">
          {formatLoad(liveStats.loadA)}{" "}
          <span className="bar-load-unit">kg</span>
        </div>
      </div>
    </div>
  );
}
