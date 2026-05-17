// App.tsx - Main application component

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Sidebar,
  LiveWorkoutPanel,
  LoadChart,
} from "./components";
import { useDevice, useWorkout, useChart } from "./hooks";
import { ProgramModeNames, EchoLevelNames } from "./lib/modes";
import type { WorkoutConfig } from "./lib/types";
import { TOTAL_SETS, getSetWeight } from "./lib/sets";
import { useAtomValue } from "jotai";
import { exercisesAtom } from "./lib/atoms";
import "./styles.css";

export function App() {

  // Set tracking (non-persistent, resets on refresh)
  const [exerciseSets, setExerciseSets] = useState<Record<string, number>>({});
  const [activeSet, setActiveSet] = useState(1);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const exercises = useAtomValue(exercisesAtom);

  // Device hook for Bluetooth connection
  const {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendStopCommand,
    startProgram,
    startEcho,
    setMonitorListener,
    setRepListener,
  } = useDevice();

  // Chart hook for visualization
  const { initChart, addData, setTimeRange, clearData, freeze } =
    useChart();

  // Auto-stop and workout complete handlers (defined before useWorkout)
  const handleAutoStop = useCallback(() => {
    void sendStopCommand().catch(() => {
      // Error already logged in sendStopCommand
    });
  }, [sendStopCommand]);

  // Advance to next set for the active exercise
  const advanceSet = useCallback(() => {
    setActiveExerciseId((exId) => {
      if (exId) {
        setExerciseSets((prev) => {
          const current = prev[exId] || 1;
          const exercise = exercises.find((e) => e.id === exId);
          const isProgram = exercise?.config.type === "program";
          const next =
            current < TOTAL_SETS
              ? current + 1
              : isProgram && current === TOTAL_SETS
                ? TOTAL_SETS + 1
                : 1;
          return { ...prev, [exId]: next };
        });
      }
      return null;
    });
  }, [exercises]);

  const completeWorkoutRef = useRef<() => void>(() => {});

  // Workout hook for state management
  const {
    currentWorkout,
    warmupReps,
    workingReps,
    warmupTarget,
    targetReps,
    isJustLiftMode,
    liveStats,
    maxPos,
    autoStopProgress,
    startWorkout,
    completeWorkout,
    resetWorkout,
    handleMonitorSample,
    handleRepNotification,
  } = useWorkout(handleAutoStop, () => {
    console.log(
      `[APP-DEBUG] onWorkoutComplete callback fired (advanceSet + completeWorkout)`
    );
    advanceSet();
    completeWorkoutRef.current();
    freeze();
  });

  useEffect(() => {
    completeWorkoutRef.current = completeWorkout;
  }, [completeWorkout]);

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

  // Keep device listeners pointed at the latest handlers (just ref assignments)
  setMonitorListener(onMonitorSample);
  setRepListener(handleRepNotification);

  // Start workout handler
  const handleStartWorkout = useCallback(
    async (config: WorkoutConfig, exerciseId?: string) => {
      // Determine current set and effective weight
      const currentSet = exerciseId ? exerciseSets[exerciseId] || 1 : 1;

      let modeName: string;
      let weightKg: number;
      let reps: number;
      let isJustLift: boolean;
      let sendDevice: () => Promise<void>;

      if (config.type === "program") {
        const { mode, weight, reps: configReps, progression } = config;
        const perCableKg = getSetWeight(weight, currentSet);
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

        const isBurnout = currentSet > TOTAL_SETS;
        if (isBurnout) {
          isJustLift = true;
          reps = 0;
        }

        modeName = isBurnout
          ? `Burnout (${ProgramModeNames[mode]})`
          : isJustLift
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
        if (exerciseId) {
          setActiveExerciseId(exerciseId);
          setActiveSet(currentSet);
        }
        startWorkout(modeName, weightKg, reps, isJustLift);
        clearData();
        await sendDevice();
      } catch (error) {
        console.error(
          `[ERROR] Failed to start workout: ${(error as Error).message}`
        );
        resetWorkout();
      }
    },
    [startProgram, startEcho, startWorkout, resetWorkout, exerciseSets, clearData]
  );

  // Stop workout handler
  const handleStop = useCallback(async () => {
    // Manual stop — save workout but don't advance the set
    // (except burnout, which always wraps back to set 1)
    console.log(`[APP-DEBUG] handleStop (manual stop) called`);
    if (activeExerciseId) {
      setExerciseSets((prev) => {
        if ((prev[activeExerciseId] || 1) > TOTAL_SETS) {
          return { ...prev, [activeExerciseId]: 1 };
        }
        return prev;
      });
    }
    setActiveExerciseId(null);
    completeWorkout();
    try {
      await sendStopCommand();
    } catch (error) {
      console.error(
        `[ERROR] Failed to stop workout: ${(error as Error).message}`
      );
    }
  }, [sendStopCommand, completeWorkout, activeExerciseId]);

  // Skip burnout — reset set counter without starting a workout
  const handleSkipBurnout = useCallback((exerciseId: string) => {
    setExerciseSets((prev) => ({ ...prev, [exerciseId]: 1 }));
  }, []);

  // Set initial chart time range
  useEffect(() => {
    setTimeRange(30);
  }, [setTimeRange]);

  // Log startup message
  useEffect(() => {
    console.log("[SUCCESS] Verano Ready");
  }, []);

  return (
    <>
      <div className="app-container">
        {/* Sidebar */}
        <Sidebar
          isConnected={isConnected}
          isConnecting={isConnecting}
          onConnect={connect}
          onDisconnect={disconnect}
          onStartWorkout={handleStartWorkout}
          onStopWorkout={handleStop}
          onSkipBurnout={handleSkipBurnout}
          exerciseSets={exerciseSets}
          activeExerciseId={activeExerciseId}
        />

        {/* Main content */}
        <main className="main-content">
          <div className="live-view-container">
            {/* Live controls card */}
            <div className="content-card">
              <LiveWorkoutPanel
                warmupReps={warmupReps}
                workingReps={workingReps}
                warmupTarget={warmupTarget}
                targetReps={targetReps}
                hasActiveWorkout={currentWorkout !== null}
                currentSet={activeSet}
                totalSets={TOTAL_SETS}
                liveStats={liveStats}
                maxPos={maxPos}
                autoStopProgress={autoStopProgress}
                isJustLiftMode={isJustLiftMode}
              />
            </div>

            {/* Analytics card */}
            <div className="content-card">
              <LoadChart initChart={initChart} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
