// components/StatsGrid.tsx - Live statistics grid

import React from "react";
import { LiveStats } from "../types";

interface StatsGridProps {
  liveStats: LiveStats;
}

function formatLoad(kg: number | undefined): string {
  if (kg === undefined || isNaN(kg)) {
    return "- kg";
  }
  return `${kg.toFixed(1)} kg`;
}

export function StatsGrid({ liveStats }: StatsGridProps) {
  const totalLoad = liveStats.loadA + liveStats.loadB;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-label">Right Cable Load</div>
        <div className="stat-value">
          {formatLoad(liveStats.loadA).split(" ")[0]}{" "}
          <span className="stat-unit">kg</span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Left Cable Load</div>
        <div className="stat-value">
          {formatLoad(liveStats.loadB).split(" ")[0]}{" "}
          <span className="stat-unit">kg</span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Total Load</div>
        <div className="stat-value">
          {formatLoad(totalLoad).split(" ")[0]}{" "}
          <span className="stat-unit">kg</span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Ticks</div>
        <div className="stat-value">{liveStats.ticks}</div>
      </div>
    </div>
  );
}
