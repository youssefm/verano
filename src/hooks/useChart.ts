// hooks/useChart.ts - Hook for managing chart state

import { useRef, useCallback, useEffect } from "react";
import { ChartManager, MonitorSample, Workout, EventMarker } from "../chart";

export interface UseChartReturn {
  chartManager: ChartManager | null;
  initChart: (containerId: string) => void;
  addData: (sample: MonitorSample) => void;
  setTimeRange: (seconds: number | null) => void;
  exportCSV: () => void;
  viewWorkout: (workout: Workout) => void;
  clearEventMarkers: () => void;
}

export function useChart(
  addLog: (message: string, type: "info" | "success" | "error") => void
): UseChartReturn {
  const chartManagerRef = useRef<ChartManager | null>(null);

  const initChart = useCallback(
    (containerId: string) => {
      if (!chartManagerRef.current) {
        chartManagerRef.current = new ChartManager(containerId);
        chartManagerRef.current.onLog = (message: string, type: string) => {
          addLog(message, type as "info" | "success" | "error");
        };
      }
      chartManagerRef.current.init();
    },
    [addLog]
  );

  const addData = useCallback((sample: MonitorSample) => {
    chartManagerRef.current?.addData(sample);
  }, []);

  const setTimeRange = useCallback((seconds: number | null) => {
    chartManagerRef.current?.setTimeRange(seconds);
  }, []);

  const exportCSV = useCallback(() => {
    chartManagerRef.current?.exportCSV();
  }, []);

  const viewWorkout = useCallback((workout: Workout) => {
    chartManagerRef.current?.viewWorkout(workout);
  }, []);

  const clearEventMarkers = useCallback(() => {
    chartManagerRef.current?.clearEventMarkers();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartManagerRef.current?.stopPeriodicUpdates();
    };
  }, []);

  return {
    chartManager: chartManagerRef.current,
    initChart,
    addData,
    setTimeRange,
    exportCSV,
    viewWorkout,
    clearEventMarkers,
  };
}
