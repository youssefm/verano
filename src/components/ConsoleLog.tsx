// components/ConsoleLog.tsx - Console log display component

import React, { useEffect, useRef } from "react";
import { LogEntry } from "../types";

interface ConsoleLogProps {
  logs: LogEntry[];
}

export function ConsoleLog({ logs }: ConsoleLogProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="live-card">
      <h2>Console Log</h2>
      <div id="log" ref={logRef}>
        {logs.map((entry) => (
          <div key={entry.id} className={`log-line log-${entry.type}`}>
            {entry.message}
          </div>
        ))}
      </div>
    </div>
  );
}
