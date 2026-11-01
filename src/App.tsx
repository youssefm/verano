// App.tsx - Main application component

import { useState, useCallback, useEffect, useRef } from "react";
import {
  AppBar,
  ExerciseCatalog,
  ExercisePage,
  LiveWorkoutPanel,
  LoadChart,
} from "./components";
import { useDevice, useWorkout, useChart } from "./hooks";
import { ProgramModeNames, EchoLevelNames } from "./lib/modes";
import type { Workout, WorkoutConfig, ExerciseProgress } from "./lib/types";
import {
  EMPTY_PROGRESS,
  TOTAL_SETS,
  isBurnoutSet,
  isOpenEndedSet,
  getCurrentSet,
  getSetWeight,
  recordCompletedSet,
} from "./lib/sets";
import { useAtomValue } from "jotai";
import { exercisesAtom } from "./lib/atoms";
import "./styles.css";

export function App() {
  // Per-exercise set progress (non-persistent, resets on refresh)
  const [progressByExercise, setProgressByExercise] = useState<
    Record<string, ExerciseProgress>
  >({});
  // Which exercise page is open (null = catalog)
  const [openExerciseId, setOpenExerciseId] = useState<string | null>(null);
  // Exercise whose set is running. A ref, because sets finish from device
  // callbacks; the open exercise is always the running one, since navigation
  // is locked while a set runs.
  const activeExerciseIdRef = useRef<string | null>(null);
  // Exercise whose data the chart currently holds
  const chartExerciseIdRef = useRef<string | null>(null);
  const exercises = useAtomValue(exercisesAtom);

  const getProgress = useCallback(
    (exerciseId: string) => progressByExercise[exerciseId] ?? EMPTY_PROGRESS,
    [progressByExercise]
  );

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
  const { initChart, destroyChart, addData, clearData, freeze } = useChart();

  const handleAutoStop = useCallback(() => {
    void sendStopCommand().catch(() => {
      // Error already logged in sendStopCommand
    });
  }, [sendStopCommand]);

  // Record a finished set against its exercise
  const recordSet = useCallback(
    (exerciseId: string, savedWorkout: Workout) => {
      const exercise = exercises.find((ex) => ex.id === exerciseId);
      if (!exercise) return;
      setProgressByExercise((prev) => ({
        ...prev,
        [exerciseId]: recordCompletedSet(
          exercise,
          prev[exerciseId] ?? EMPTY_PROGRESS,
          { reps: savedWorkout.reps, weightKg: savedWorkout.weightKg }
        ),
      }));
    },
    [exercises]
  );

  // A set finished on its own (target reps reached or Just Lift auto-stop)
  const handleWorkoutDone = useCallback(
    (savedWorkout: Workout | null) => {
      const exerciseId = activeExerciseIdRef.current;
      if (exerciseId && savedWorkout) {
        recordSet(exerciseId, savedWorkout);
      }
      activeExerciseIdRef.current = null;
      freeze();
    },
    [recordSet, freeze]
  );

  // Workout hook for state management
  const {
    currentWorkout,
    warmupReps,
    workingReps,
    warmupTarget,
    targetReps,
    liveStats,
    maxPos,
    startWorkout,
    completeWorkout,
    resetWorkout,
    handleMonitorSample,
    handleRepNotification,
  } = useWorkout(handleAutoStop, handleWorkoutDone);

  const isSetRunning = currentWorkout !== null;

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
    async (config: WorkoutConfig, exerciseId: string) => {
      const currentSet = getCurrentSet(getProgress(exerciseId));

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

        const isBurnout = isBurnoutSet(currentSet);
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
        activeExerciseIdRef.current = exerciseId;
        startWorkout(modeName, weightKg, reps, isJustLift);
        clearData();
        await sendDevice();
      } catch (error) {
        console.error(
          `[ERROR] Failed to start workout: ${(error as Error).message}`
        );
        activeExerciseIdRef.current = null;
        resetWorkout();
        freeze();
      }
    },
    [
      startProgram,
      startEcho,
      startWorkout,
      resetWorkout,
      getProgress,
      clearData,
      freeze,
    ]
  );

  // Stop workout handler
  const handleStop = useCallback(async () => {
    // Manual stop counts an open-ended set (Just Lift, burnout, no rep
    // target) — that's how those sets end. A set with a rep target that is
    // stopped early isn't counted, so the user redoes it.
    console.log(`[APP-DEBUG] handleStop (manual stop) called`);
    const exerciseId = activeExerciseIdRef.current;
    const exercise = exercises.find((ex) => ex.id === exerciseId);
    const savedWorkout = completeWorkout();
    if (
      exercise &&
      savedWorkout &&
      isOpenEndedSet(exercise, getCurrentSet(getProgress(exercise.id)))
    ) {
      recordSet(exercise.id, savedWorkout);
    }
    activeExerciseIdRef.current = null;
    freeze();
    try {
      await sendStopCommand();
    } catch (error) {
      console.error(
        `[ERROR] Failed to stop workout: ${(error as Error).message}`
      );
    }
  }, [
    sendStopCommand,
    completeWorkout,
    exercises,
    getProgress,
    recordSet,
    freeze,
  ]);

  const handleSkipBurnout = useCallback((exerciseId: string) => {
    setProgressByExercise((prev) => ({
      ...prev,
      [exerciseId]: {
        ...(prev[exerciseId] ?? EMPTY_PROGRESS),
        isDone: true,
        skippedBurnout: true,
      },
    }));
  }, []);

  const handleOpenExercise = useCallback(
    (exerciseId: string) => {
      // Keep this exercise's last set on the chart; otherwise start fresh
      // (live, so the cables show before the first set).
      if (chartExerciseIdRef.current !== exerciseId) {
        clearData();
        chartExerciseIdRef.current = exerciseId;
      }
      setOpenExerciseId(exerciseId);
    },
    [clearData]
  );

  const handleShowCatalog = useCallback(() => {
    if (isSetRunning) return;
    setOpenExerciseId(null);
  }, [isSetRunning]);

  // Log startup message
  useEffect(() => {
    console.log("[SUCCESS] Verano Ready");
  }, []);

  const openExercise = exercises.find((ex) => ex.id === openExerciseId);

  return (
    <div className="app-shell">
      <AppBar
        exerciseName={openExercise?.name}
        canNavigate={!isSetRunning}
        onShowCatalog={handleShowCatalog}
        isConnected={isConnected}
        isConnecting={isConnecting}
        onConnect={connect}
        onDisconnect={disconnect}
      />

      {openExercise ? (
        <ExercisePage
          exercise={openExercise}
          progress={getProgress(openExercise.id)}
          isConnected={isConnected}
          isRunning={isSetRunning}
          onStart={(config) => void handleStartWorkout(config, openExercise.id)}
          onStop={() => void handleStop()}
          onSkipBurnout={() => handleSkipBurnout(openExercise.id)}
          onBack={handleShowCatalog}
          livePanel={
            <LiveWorkoutPanel
              warmupReps={warmupReps}
              workingReps={workingReps}
              warmupTarget={warmupTarget}
              targetReps={targetReps}
              hasActiveWorkout={isSetRunning}
              currentSet={getCurrentSet(getProgress(openExercise.id))}
              totalSets={TOTAL_SETS}
              liveStats={liveStats}
              maxPos={maxPos}
            />
          }
          chart={
            <LoadChart initChart={initChart} destroyChart={destroyChart} />
          }
        />
      ) : (
        <ExerciseCatalog
          getProgress={getProgress}
          onOpenExercise={handleOpenExercise}
        />
      )}
    </div>
  );
}
