// hooks/useToday.ts - The current local date, kept fresh while the app stays open

import { useEffect, useState } from "react";

/** Local calendar date as YYYY-MM-DD. */
function getLocalDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Milliseconds until the next local midnight (DST-safe). */
function getMsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );
  return midnight.getTime() - now.getTime();
}

/**
 * Returns today's local date and re-renders when it changes. A timer fires at
 * midnight; focus and visibility checks cover sleep and background tabs, where
 * browsers delay or suspend timers.
 */
export function useToday(): string {
  const [today, setToday] = useState(getLocalDate);

  useEffect(() => {
    let timerId: number;

    const refresh = () => {
      setToday(getLocalDate());
      window.clearTimeout(timerId);
      // Small slack so the timer never lands just before midnight
      timerId = window.setTimeout(refresh, getMsUntilMidnight() + 1000);
    };

    refresh();
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return today;
}
