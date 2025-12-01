// components/ConfigSection.tsx - Configuration options

import React from "react";

interface ConfigSectionProps {
  stopAtTop: boolean;
  onStopAtTopChange: (value: boolean) => void;
}

export function ConfigSection({
  stopAtTop,
  onStopAtTopChange,
}: ConfigSectionProps) {
  return (
    <div className="section">
      <h2>Configuration</h2>

      <div className="form-group">
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={stopAtTop}
            onChange={(e) => onStopAtTopChange(e.target.checked)}
            style={{ width: "auto", cursor: "pointer" }}
          />
          <span>Stop at top of final rep</span>
        </label>
      </div>

      <div style={{ fontSize: "0.8em", color: "#6c757d", lineHeight: 1.4 }}>
        When enabled, the workout will automatically stop when you reach the top
        position of your final rep. Useful for exercises like squats where you
        want to finish standing.
      </div>
    </div>
  );
}
