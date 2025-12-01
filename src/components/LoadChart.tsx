// components/LoadChart.tsx - Chart component for load history

import React, { useEffect, useRef } from "react";

interface LoadChartProps {
  onTimeRangeChange: (seconds: number | null) => void;
  onExport: () => void;
  initChart: (containerId: string) => void;
  currentTimeRange: number | null;
}

export function LoadChart({
  onTimeRangeChange,
  onExport,
  initChart,
  currentTimeRange,
}: LoadChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (containerRef.current && !isInitialized.current) {
      initChart("loadGraph");
      isInitialized.current = true;
    }
  }, [initChart]);

  const timeRanges = [
    { seconds: 10, label: "10s", id: "range10s" },
    { seconds: 30, label: "30s", id: "range30s" },
    { seconds: 60, label: "1m", id: "range60s" },
    { seconds: 120, label: "2m", id: "range2m" },
    { seconds: null, label: "All", id: "rangeAll" },
  ];

  return (
    <div>
      <h3 style={{ color: "#667eea", marginBottom: "10px" }}>Load History</h3>
      <div id="loadGraphContainer">
        <div className="time-range-selector">
          {timeRanges.map((range) => (
            <button
              key={range.id}
              id={range.id}
              onClick={() => onTimeRangeChange(range.seconds)}
              className={currentTimeRange === range.seconds ? "active" : ""}
            >
              {range.label}
            </button>
          ))}
          <button className="export-btn" onClick={onExport}>
            Export CSV
          </button>
        </div>
        <div className="data-retention-note">
          📊 Retains up to 2 hours of data.
        </div>
        <div id="loadGraph" ref={containerRef}></div>
      </div>
    </div>
  );
}
