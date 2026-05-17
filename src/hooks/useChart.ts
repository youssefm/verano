// hooks/useChart.ts - Hook for managing chart state

import { useRef, useCallback, useEffect } from "react";
import type { MonitorSample } from "../lib/chart";
import { ChartManager } from "../lib/chart";

export interface UseChartReturn {
  initChart: (containerId: string) => void;
  addData: (sample: MonitorSample) => void;
  clearData: () => void;
  freeze: () => void;
}

export function useChart(): UseChartReturn {
  const chartManagerRef = useRef<ChartManager | null>(null);

  const initChart = useCallback((containerId: string) => {
    if (!chartManagerRef.current) {
      chartManagerRef.current = new ChartManager(containerId);
    }
    chartManagerRef.current.init();
  }, []);

  const addData = useCallback((sample: MonitorSample) => {
    chartManagerRef.current?.addData(sample);
  }, []);

  const clearData = useCallback(() => {
    chartManagerRef.current?.clearData();
  }, []);

  const freeze = useCallback(() => {
    chartManagerRef.current?.freeze();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartManagerRef.current?.stopPeriodicUpdates();
    };
  }, []);

  return {
    initChart,
    addData,
    clearData,
    freeze,
  };
}
