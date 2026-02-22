// App.tsx - Main application component

import React, { useState, useCallback, useEffect } from "react";
import {
  Sidebar,
  PositionBars,
  StatsGrid,
  RepCounters,
  LoadChart,
  WorkoutHistory,
} from "./components";
import { useDevice, useWorkout, useChart } from "./hooks";
import { ProgramModeNames, EchoLevelNames } from "./lib/modes";
import { WorkoutConfig } from "./lib/types";
import "./styles.css";

export function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTimeRange, setCurrentTimeRange] = useState<number | null>(30);

  // Device hook for Bluetooth connection
  const {
    isConnected,
    connect,
    disconnect,
    sendStopCommand,
    startProgram,
    startEcho,
    addMonitorListener,
    addRepListener,
  } = useDevice();

  // Chart hook for visualization
  const { initChart, addData, setTimeRange, exportCSV, viewWorkout } =
    useChart();

  // Auto-stop and workout complete handlers (defined before useWorkout)
  const handleAutoStop = useCallback(async () => {
    try {
      await sendStopCommand();
    } catch (error) {
      // Error already logged in sendStopCommand
    }
  }, [sendStopCommand]);

  // Workout hook for state management
  const {
    currentWorkout,
    warmupReps,
    workingReps,
    warmupTarget,
    targetReps,
    workoutHistory,
    isJustLiftMode,
    liveStats,
    repRanges,
    maxPos,
    autoStopProgress,
    startWorkout,
    completeWorkout,
    resetWorkout,
    handleMonitorSample,
    handleRepNotification,
    viewWorkoutOnGraph,
  } = useWorkout(handleAutoStop, () => {
    completeWorkout();
  });

  // Handle monitor samples - update chart and workout
  const onMonitorSample = useCallback(
    (sample: {
      timestamp: Date;
      ticks: number;
      posA: number;
      posB: number;
      loadA: number;
      loadB: number;
    }) => {
      handleMonitorSample(sample);
      addData(sample);
    },
    [handleMonitorSample, addData],
  );

  // Start workout handler
  const handleStartWorkout = useCallback(
    async (config: WorkoutConfig) => {
      let modeName: string;
      let weightKg: number;
      let reps: number;
      let isJustLift: boolean;
      let sendDevice: () => Promise<void>;

      if (config.type === "program") {
        const { mode, weight, reps: configReps, progression } = config;
        const perCableKg = weight;
        const effectiveKg = perCableKg + 10.0;
        isJustLift = config.isJustLift;
        reps = configReps;
        weightKg = perCableKg;

        if (isNaN(weight) || weight < 0 || weight > 100) {
          alert("Please enter a valid weight (0-100 kg)");
          return;
        }

        if (!isJustLift && (isNaN(reps) || reps < 1 || reps > 100)) {
          alert("Please enter a valid number of reps (1-100)");
          return;
        }

        if (isNaN(progression) || progression < -3 || progression > 3) {
          alert("Please enter a valid progression (-3 to 3 kg)");
          return;
        }

        modeName = isJustLift
          ? `Just Lift (${ProgramModeNames[mode]})`
          : ProgramModeNames[mode];

        sendDevice = () =>
          startProgram({
            mode,
            baseMode: mode,
            isJustLift,
            reps,
            perCableKg,
            perCableDisplay: perCableKg,
            effectiveKg,
            effectiveDisplay: effectiveKg,
            progressionKg: progression,
            displayUnit: "kg",
            sequenceID: 0x0b,
          });
      } else {
        const { level, eccentricPct, targetReps } = config;
        isJustLift = config.isJustLift;
        reps = targetReps;
        weightKg = 0;

        if (isNaN(eccentricPct) || eccentricPct < 0 || eccentricPct > 150) {
          alert("Please enter a valid eccentric percentage (0-150)");
          return;
        }

        if (
          !isJustLift &&
          (isNaN(targetReps) || targetReps < 0 || targetReps > 30)
        ) {
          alert("Please enter valid target reps (0-30)");
          return;
        }

        modeName = isJustLift
          ? `Just Lift Echo ${EchoLevelNames[level]}`
          : `Echo ${EchoLevelNames[level]}`;

        sendDevice = () =>
          startEcho({
            level,
            eccentricPct,
            warmupReps: 3,
            targetReps,
            isJustLift,
            sequenceID: 0x01,
          });
      }

      try {
        startWorkout(modeName, weightKg, reps, isJustLift);
        await sendDevice();
        addMonitorListener(onMonitorSample);
        addRepListener(handleRepNotification);
        setSidebarOpen(false);
      } catch (error) {
        console.error(
          `[ERROR] Failed to start workout: ${(error as Error).message}`,
        );
        resetWorkout();
      }
    },
    [
      startProgram,
      startEcho,
      addMonitorListener,
      addRepListener,
      startWorkout,
      resetWorkout,
      onMonitorSample,
      handleRepNotification,
    ],
  );

  // Stop workout handler
  const handleStop = useCallback(async () => {
    try {
      await sendStopCommand();
      completeWorkout();
    } catch (error) {
      console.error(
        `[ERROR] Failed to stop workout: ${(error as Error).message}`,
      );
    }
  }, [sendStopCommand, completeWorkout]);

  // Handle viewing workout on graph
  const handleViewGraph = useCallback(
    (index: number) => {
      const workout = viewWorkoutOnGraph(index);
      if (workout) {
        viewWorkout(workout);
      }
    },
    [viewWorkoutOnGraph, viewWorkout],
  );

  // Handle time range change
  const handleTimeRangeChange = useCallback(
    (seconds: number | null) => {
      setCurrentTimeRange(seconds);
      setTimeRange(seconds);
    },
    [setTimeRange],
  );

  // Log startup message
  useEffect(() => {
    console.log("[SUCCESS] Vitruvian Web Control Ready");
  }, []);

  return (
    <>
      {/* Mobile hamburger menu */}
      <button
        className="hamburger"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay for mobile */}
      <div
        className={`overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      <div className="app-container">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          isConnected={isConnected}
          onConnect={connect}
          onDisconnect={disconnect}
          onStartWorkout={handleStartWorkout}
        />

        {/* Main content */}
        <main className="main-content">
          <div className="live-view-container">
            {/* Live controls card */}
            <div className="content-card">
              <h2>Live Workout Data</h2>

              {/* Rep Counters */}
              <RepCounters
                warmupReps={warmupReps}
                workingReps={workingReps}
                warmupTarget={warmupTarget}
                targetReps={targetReps}
                hasActiveWorkout={currentWorkout !== null}
              />

              {/* Position Visualizer */}
              <PositionBars
                liveStats={liveStats}
                repRanges={repRanges}
                maxPos={maxPos}
                autoStopProgress={autoStopProgress}
                isJustLiftMode={isJustLiftMode}
                onStop={handleStop}
                hasActiveWorkout={currentWorkout !== null}
                isConnected={isConnected}
              />

              {/* Stats Grid */}
              <StatsGrid liveStats={liveStats} />
            </div>

            {/* Analytics card */}
            <div className="content-card">
              <div
                id="graphHistoryContainer"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "20px",
                }}
              >
                <LoadChart
                  onTimeRangeChange={handleTimeRangeChange}
                  onExport={exportCSV}
                  initChart={initChart}
                  currentTimeRange={currentTimeRange}
                />

                <WorkoutHistory
                  workouts={workoutHistory}
                  onViewGraph={handleViewGraph}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
