// App.tsx - Main application component

import React, { useState, useCallback, useEffect } from "react";
import {
  Sidebar,
  ConsoleLog,
  PositionBars,
  StatsGrid,
  RepCounters,
  LoadChart,
  WorkoutHistory,
} from "./components";
import { useDevice, useWorkout, useChart } from "./hooks";
import {
  ProgramModeType,
  EchoLevelType,
  ProgramModeNames,
  EchoLevelNames,
} from "./modes";
import { DeviceProgramParams, DeviceEchoParams } from "./device";
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
    logs,
    addLog,
  } = useDevice();

  // Chart hook for visualization
  const { initChart, addData, setTimeRange, exportCSV, viewWorkout } =
    useChart(addLog);

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
    stopAtTop,
    liveStats,
    repRanges,
    maxPos,
    autoStopProgress,
    startWorkout,
    completeWorkout,
    resetWorkout,
    setStopAtTop,
    handleMonitorSample,
    handleRepNotification,
    viewWorkoutOnGraph,
  } = useWorkout(addLog, handleAutoStop, () => {
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
    [handleMonitorSample, addData]
  );

  // Start program handler
  const handleStartProgram = useCallback(
    async (
      mode: ProgramModeType,
      weight: number,
      reps: number,
      progression: number,
      isJustLift: boolean
    ) => {
      const perCableKg = weight;
      const effectiveKg = perCableKg + 10.0;

      // Validate inputs
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

      const modeName = isJustLift
        ? `Just Lift (${ProgramModeNames[mode]})`
        : ProgramModeNames[mode];

      const params: DeviceProgramParams = {
        mode: mode,
        baseMode: mode,
        isJustLift: isJustLift,
        reps: reps,
        perCableKg: perCableKg,
        perCableDisplay: perCableKg,
        effectiveKg: effectiveKg,
        effectiveDisplay: effectiveKg,
        progressionKg: progression,
        displayUnit: "kg",
        sequenceID: 0x0b,
      };

      try {
        startWorkout(modeName, perCableKg, reps, isJustLift);
        await startProgram(params);

        // Set up listeners
        addMonitorListener(onMonitorSample);
        addRepListener(handleRepNotification);

        // Close sidebar on mobile
        setSidebarOpen(false);
      } catch (error) {
        addLog(`Failed to start program: ${(error as Error).message}`, "error");
        resetWorkout();
      }
    },
    [
      startProgram,
      addMonitorListener,
      addRepListener,
      startWorkout,
      resetWorkout,
      addLog,
      onMonitorSample,
      handleRepNotification,
    ]
  );

  // Start echo handler
  const handleStartEcho = useCallback(
    async (
      level: EchoLevelType,
      eccentricPct: number,
      targetReps: number,
      isJustLift: boolean
    ) => {
      // Validate inputs
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

      const modeName = isJustLift
        ? `Just Lift Echo ${EchoLevelNames[level]}`
        : `Echo ${EchoLevelNames[level]}`;

      const params: DeviceEchoParams = {
        level: level,
        eccentricPct: eccentricPct,
        warmupReps: 3,
        targetReps: targetReps,
        isJustLift: isJustLift,
        sequenceID: 0x01,
      };

      try {
        startWorkout(modeName, 0, targetReps, isJustLift);
        await startEcho(params);

        // Set up listeners
        addMonitorListener(onMonitorSample);
        addRepListener(handleRepNotification);

        // Close sidebar on mobile
        setSidebarOpen(false);
      } catch (error) {
        addLog(
          `Failed to start Echo mode: ${(error as Error).message}`,
          "error"
        );
        resetWorkout();
      }
    },
    [
      startEcho,
      addMonitorListener,
      addRepListener,
      startWorkout,
      resetWorkout,
      addLog,
      onMonitorSample,
      handleRepNotification,
    ]
  );

  // Stop workout handler
  const handleStop = useCallback(async () => {
    try {
      await sendStopCommand();
      completeWorkout();
    } catch (error) {
      addLog(`Failed to stop workout: ${(error as Error).message}`, "error");
    }
  }, [sendStopCommand, completeWorkout, addLog]);

  // Handle viewing workout on graph
  const handleViewGraph = useCallback(
    (index: number) => {
      const workout = viewWorkoutOnGraph(index);
      if (workout) {
        viewWorkout(workout);
      }
    },
    [viewWorkoutOnGraph, viewWorkout]
  );

  // Handle time range change
  const handleTimeRangeChange = useCallback(
    (seconds: number | null) => {
      setCurrentTimeRange(seconds);
      setTimeRange(seconds);
    },
    [setTimeRange]
  );

  // Log startup messages
  useEffect(() => {
    addLog("Vitruvian Web Control Ready", "success");
    addLog('Click "Connect to Device" to begin', "info");
    addLog("", "info");
    addLog("Requirements:", "info");
    addLog("- Chrome, Edge, or Opera browser", "info");
    addLog("- HTTPS connection (or localhost)", "info");
    addLog("- Bluetooth enabled on your device", "info");
  }, [addLog]);

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
          onClose={() => setSidebarOpen(false)}
          isConnected={isConnected}
          onConnect={connect}
          onDisconnect={disconnect}
          onStartProgram={handleStartProgram}
          onStartEcho={handleStartEcho}
          stopAtTop={stopAtTop}
          onStopAtTopChange={(value) => {
            setStopAtTop(value);
            addLog(
              `Stop at top of final rep: ${value ? "enabled" : "disabled"}`,
              "info"
            );
          }}
        />

        {/* Main content */}
        <main className="main-content">
          <div className="live-view-container">
            {/* Live stats card */}
            <div className="live-card">
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

              {/* Load Graph and History Section */}
              <div
                id="graphHistoryContainer"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "20px",
                  marginBottom: "20px",
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

            {/* Log card */}
            <ConsoleLog logs={logs} />
          </div>
        </main>
      </div>
    </>
  );
}
