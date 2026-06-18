export interface QuietHours {
  start: string | null;
  end: string | null;
}

function parseHHMM(value: string): { h: number; m: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

/** Minutes since local midnight for a given Date. */
function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** True if the given local time falls inside the quiet-hours window. */
export function isInQuietHours(date: Date, quiet: QuietHours): boolean {
  if (!quiet.start || !quiet.end) return false;
  const start = parseHHMM(quiet.start);
  const end = parseHHMM(quiet.end);
  if (!start || !end) return false;

  const t = minutesOfDay(date);
  const s = start.h * 60 + start.m;
  const e = end.h * 60 + end.m;

  if (s === e) return false;
  if (s < e) {
    return t >= s && t < e;
  }
  // Overnight window (e.g. 22:00 -> 08:00)
  return t >= s || t < e;
}

/** Returns the next Date >= `date` that is outside quiet hours. */
export function nextTimeOutsideQuietHours(date: Date, quiet: QuietHours): Date {
  if (!isInQuietHours(date, quiet)) return date;
  const end = parseHHMM(quiet.end as string);
  if (!end) return date;

  const result = new Date(date);
  result.setSeconds(0, 0);
  result.setHours(end.h, end.m, 0, 0);
  // If end time is earlier today than `date`, the window ends tomorrow.
  if (result.getTime() <= date.getTime()) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

/**
 * Compute the next valid fire time given the current time, interval, quiet
 * hours, and an optional DND-until timestamp. Pure and easy to unit test.
 */
export function computeNextFireTime(params: {
  from: Date;
  intervalMinutes: number;
  quiet: QuietHours;
  dndUntil?: Date | null;
}): Date {
  const { from, intervalMinutes, quiet, dndUntil } = params;
  let candidate = new Date(from.getTime() + intervalMinutes * 60 * 1000);

  if (dndUntil && dndUntil.getTime() > candidate.getTime()) {
    candidate = new Date(dndUntil.getTime());
  }

  candidate = nextTimeOutsideQuietHours(candidate, quiet);
  return candidate;
}
