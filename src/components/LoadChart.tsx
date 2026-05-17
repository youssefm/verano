// components/LoadChart.tsx - Chart component for load visualization

import { useEffect, useRef } from "react";

interface LoadChartProps {
  initChart: (containerId: string) => void;
}

export function LoadChart({ initChart }: LoadChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (containerRef.current && !isInitialized.current) {
      initChart("loadGraph");
      isInitialized.current = true;
    }
  }, [initChart]);

  return (
    <div id="loadGraphContainer">
      <div id="loadGraph" ref={containerRef}></div>
    </div>
  );
}
