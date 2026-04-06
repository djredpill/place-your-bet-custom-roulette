// ============================================================
// Streak Detector — monitors spin history for pattern streaks
// Checks: Color, Parity, Dozen, Column, High/Low
// Adjustable threshold (default 7, range 5-10)
// ============================================================

import { getNumberColor, RED_NUMBERS, BLACK_NUMBERS } from "./roulette-data";

export interface StreakAlert {
  id: string;
  type: "color" | "parity" | "dozen" | "column" | "range";
  label: string;
  value: string;
  count: number;
  suggestion: string;
  suggestedBetType: string;
  timestamp: number;
}

interface NumberProps {
  color: "red" | "black" | "green";
  parity: "odd" | "even" | null;
  dozen: 1 | 2 | 3 | null;
  column: 1 | 2 | 3 | null;
  range: "low" | "high" | null;
}

function getNumberProps(num: number | string): NumberProps {
  const n = typeof num === "string" ? parseInt(num) : num;
  const isZero = num === 0 || num === "00" || num === "0";

  return {
    color: getNumberColor(num),
    parity: isZero ? null : (n % 2 === 0 ? "even" : "odd"),
    dozen: isZero ? null : (n <= 12 ? 1 : n <= 24 ? 2 : 3),
    column: isZero ? null : (((n - 1) % 3) + 1) as 1 | 2 | 3,
    range: isZero ? null : (n <= 18 ? "low" : "high"),
  };
}

export function detectStreaks(
  history: { number: number | string }[],
  threshold: number = 7
): StreakAlert[] {
  if (history.length < threshold) return [];

  const alerts: StreakAlert[] = [];
  const recent = history.slice(0, Math.max(threshold + 5, 15));
  const props = recent.map(h => getNumberProps(h.number));

  // Filter out greens for streak checking
  const nonGreenProps = props.filter(p => p.color !== "green");
  const nonGreenRecent = recent.filter(h => {
    const c = getNumberColor(h.number);
    return c !== "green";
  });

  if (nonGreenProps.length < threshold) return alerts;

  // Check Color streak
  const firstColor = nonGreenProps[0].color;
  let colorStreak = 0;
  for (const p of nonGreenProps) {
    if (p.color === firstColor) colorStreak++;
    else break;
  }
  if (colorStreak >= threshold) {
    const opposite = firstColor === "red" ? "Black" : "Red";
    alerts.push({
      id: `color-${Date.now()}`,
      type: "color",
      label: `${colorStreak}x ${firstColor.toUpperCase()}`,
      value: firstColor,
      count: colorStreak,
      suggestion: `Consider betting ${opposite}`,
      suggestedBetType: opposite.toLowerCase(),
      timestamp: Date.now(),
    });
  }

  // Check Parity streak
  const parityProps = nonGreenProps.filter(p => p.parity !== null);
  if (parityProps.length >= threshold) {
    const firstParity = parityProps[0].parity;
    let parityStreak = 0;
    for (const p of parityProps) {
      if (p.parity === firstParity) parityStreak++;
      else break;
    }
    if (parityStreak >= threshold) {
      const opposite = firstParity === "odd" ? "Even" : "Odd";
      alerts.push({
        id: `parity-${Date.now()}`,
        type: "parity",
        label: `${parityStreak}x ${firstParity!.toUpperCase()}`,
        value: firstParity!,
        count: parityStreak,
        suggestion: `Consider betting ${opposite}`,
        suggestedBetType: opposite.toLowerCase(),
        timestamp: Date.now(),
      });
    }
  }

  // Check Dozen streak
  const dozenProps = nonGreenProps.filter(p => p.dozen !== null);
  if (dozenProps.length >= threshold) {
    const firstDozen = dozenProps[0].dozen;
    let dozenStreak = 0;
    for (const p of dozenProps) {
      if (p.dozen === firstDozen) dozenStreak++;
      else break;
    }
    if (dozenStreak >= threshold) {
      // Find coldest dozen
      const dozenCounts = { 1: 0, 2: 0, 3: 0 };
      nonGreenProps.forEach(p => { if (p.dozen) dozenCounts[p.dozen]++; });
      const coldest = (Object.entries(dozenCounts) as [string, number][])
        .reduce((a, b) => a[1] <= b[1] ? a : b)[0];
      const dozenLabels: Record<string, string> = { "1": "1st 12", "2": "2nd 12", "3": "3rd 12" };
      alerts.push({
        id: `dozen-${Date.now()}`,
        type: "dozen",
        label: `${dozenStreak}x ${dozenLabels[String(firstDozen)]}`,
        value: String(firstDozen),
        count: dozenStreak,
        suggestion: `Consider betting ${dozenLabels[coldest]} (coldest)`,
        suggestedBetType: `dozen-${coldest}`,
        timestamp: Date.now(),
      });
    }
  }

  // Check Column streak
  const colProps = nonGreenProps.filter(p => p.column !== null);
  if (colProps.length >= threshold) {
    const firstCol = colProps[0].column;
    let colStreak = 0;
    for (const p of colProps) {
      if (p.column === firstCol) colStreak++;
      else break;
    }
    if (colStreak >= threshold) {
      const colCounts = { 1: 0, 2: 0, 3: 0 };
      nonGreenProps.forEach(p => { if (p.column) colCounts[p.column]++; });
      const coldest = (Object.entries(colCounts) as [string, number][])
        .reduce((a, b) => a[1] <= b[1] ? a : b)[0];
      alerts.push({
        id: `column-${Date.now()}`,
        type: "column",
        label: `${colStreak}x Column ${firstCol}`,
        value: String(firstCol),
        count: colStreak,
        suggestion: `Consider betting Column ${coldest} (coldest)`,
        suggestedBetType: `column-${coldest}`,
        timestamp: Date.now(),
      });
    }
  }

  // Check High/Low streak
  const rangeProps = nonGreenProps.filter(p => p.range !== null);
  if (rangeProps.length >= threshold) {
    const firstRange = rangeProps[0].range;
    let rangeStreak = 0;
    for (const p of rangeProps) {
      if (p.range === firstRange) rangeStreak++;
      else break;
    }
    if (rangeStreak >= threshold) {
      const opposite = firstRange === "low" ? "19-36 (High)" : "1-18 (Low)";
      alerts.push({
        id: `range-${Date.now()}`,
        type: "range",
        label: `${rangeStreak}x ${firstRange === "low" ? "1-18" : "19-36"}`,
        value: firstRange!,
        count: rangeStreak,
        suggestion: `Consider betting ${opposite}`,
        suggestedBetType: firstRange === "low" ? "high" : "low",
        timestamp: Date.now(),
      });
    }
  }

  return alerts;
}
