// hooks/useChart.ts - Hook for managing chart state

import { useRef, useCallback, useEffect } from "react";
import {
  ChartManager,
  MonitorSample,
  Workout,
  EventMarker,
} from "../lib/chart";

export interface UseChartReturn {
  chartManager: ChartManager | null;
  initChart: (containerId: string) => void;
  addData: (sample: MonitorSample) => void;
  setTimeRange: (seconds: number | null) => void;
  exportCSV: () => void;
  viewWorkout: (workout: Workout) => void;
  clearEventMarkers: () => void;
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
