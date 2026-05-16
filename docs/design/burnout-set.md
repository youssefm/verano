# Burnout Set

## Problem

After completing 3 working sets of an exercise, there's no option to do a lighter "burnout" finisher. The set cycle wraps from 3 back to 1 immediately. Users want a 4th optional set at reduced resistance where they lift as long as they can and manually stop.

## Proposed solution

Extend the set counter from `{1, 2, 3}` to `{1, 2, 3, 4}`. After set 3 auto-completes, `advanceSet` advances the counter to 4 (for program-mode exercises) instead of wrapping to 1. When `currentSet === 4`, ExerciseCard shows **Burnout** and **Skip** buttons instead of the normal Start button. Burnout only applies to program-mode exercises; echo exercises wrap 3→1 as before.

### Set cycle

```
1 → 2 → 3 → 4 (burnout or skip) → 1
```

All burnout state is encoded in the existing `exerciseSets` counter — no new state variables. `TOTAL_SETS` stays 3 (the display ceiling for normal sets). A `currentSet > TOTAL_SETS` check derives whether an exercise is in the burnout phase.

### Starting a burnout workout

`handleStartWorkout` already reads `currentSet` from `exerciseSets`. When `currentSet > TOTAL_SETS`:

- `getSetWeight(base, 4)` computes the weight (≈ 0.729× base — another -10% from set 3)
- Force Just Lift semantics (`isJustLift = true`, `reps = 0`)
- Mode name: `"Burnout (Old School)"` etc.
- Normal 3-rep warmup is preserved

### Stopping a burnout workout

`handleStop` must wrap the set counter to 1 when stopping a burnout workout. Since the existing `handleStop` doesn't have `activeExerciseId` or `exerciseSets` in its closure, it must use the state-updater pattern (like `advanceSet` does) to read fresh values:

```ts
setActiveExerciseId((exId) => {
  if (exId) {
    setExerciseSets((prev) => {
      if ((prev[exId] || 1) > TOTAL_SETS) {
        return { ...prev, [exId]: 1 };
      }
      return prev;
    });
  }
  return null;
});
```

Auto-stop (5-second rest detection) remains active — burnout uses Just Lift mode, which already wires it in.

**Invariant**: `advanceSet` is unreachable during burnout because burnout uses Just Lift mode, and the `onWorkoutComplete` callback is guarded by `!isJustLiftMode` in `useRepCounter`. Manual stop is the only completion path.

### Skipping burnout

ExerciseCard's Skip button sets `exerciseSets[id] = 1`. No workout is started or saved.

### ExerciseCard UI

When `currentSet > TOTAL_SETS`, replace the Start button with:

```
[🔥 Burnout · 14.6 kg]   [Skip →]
```

The burnout button shows the effective burnout weight. Both buttons return the counter to the normal cycle.

### RepCounters UI

During burnout (`activeSet > TOTAL_SETS`):

- Label: **"Burnout"** (amber background) instead of "Working" (green)
- Rep count with no target denominator (e.g., `"7"` not `"7/12"`)
- Set indicator: **"Burnout"** instead of `"Set N/3"`

## Key decisions

- **Burnout is set 4 in the counter, not a standalone action** — the counter naturally gates burnout behind completing 3 sets. Chose this over a separate "always available" button that would need its own tracking of whether the user has completed a full cycle.
- **Program mode only** — the -10% weight drop doesn't translate to echo's adaptive resistance.
- **Keep 3-rep warmup** — burnout includes the normal warmup phase.
- **Keep auto-stop active** — 5-second rest detection is a safety net, not a nuisance.
- **Manual stop wraps to set 1** — this diverges from normal sets (where manual stop doesn't advance), but burnout is *always* manually stopped, so wrapping is the expected behavior.
