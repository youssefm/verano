// sets.ts - Set tracking constants and weight calculation

export const TOTAL_SETS = 3;
export const SET_REDUCTION = 0.1;

/** Return the effective weight for a given set number (1-based). */
export function getSetWeight(baseWeight: number, set: number): number {
  return +(baseWeight * Math.pow(1 - SET_REDUCTION, set - 1)).toFixed(1);
}
