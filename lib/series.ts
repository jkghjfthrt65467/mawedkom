import { addDaysIso } from "./calendar";

export function sessionCountOf(count?: number): number {
  if (typeof count !== "number" || count < 2) return 1;
  return Math.min(24, Math.round(count));
}

export function sessionIntervalDays(days?: number): number {
  if (typeof days !== "number" || days < 1) return 7;
  return Math.min(90, Math.round(days));
}

export function planSessionDates(startIso: string, count: number, intervalDays?: number): string[] {
  const n = sessionCountOf(count);
  const step = sessionIntervalDays(intervalDays);
  if (n <= 1) return [startIso];
  return Array.from({ length: n }, (_, i) => addDaysIso(startIso, i * step));
}
