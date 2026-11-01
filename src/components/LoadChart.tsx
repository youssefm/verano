// components/LoadChart.tsx - Chart component for load visualization

import { useEffect } from "react";

interface LoadChartProps {
  initChart: (containerId: string) => void;
  destroyChart: () => void;
}

export function LoadChart({ initChart, destroyChart }: LoadChartProps) {
  // The chart is rebuilt every time this mounts (e.g. reopening an exercise);
  // the recorded data lives in the chart manager, so it survives navigation.
  useEffect(() => {
    initChart("loadGraph");
    return destroyChart;
  }, [initChart, destroyChart]);

  return <div id="loadGraph" className="load-chart" />;
}
