import { getDb } from '../db/client';
import { getReminderSettings } from './settings';

export interface DailyStat {
  date: string;
  completed_count: number;
  skipped_count: number;
  completion_rate: number;
}

export interface StreakInfo {
  current: number;
  best: number;
}

export interface HeatmapCell {
  date: string;
  completed_count: number;
  skipped_count: number;
  completion_rate: number;
  intensity: number;
}

export interface StatsSummary {
  completedThisWeek: number;
  skippedThisWeek: number;
  totalDone: number;
}

interface RawLog {
  action: string;
  action_at: string;
}

const STREAK_THRESHOLD = 0.8;

function localDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateKeyFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function getAllActionLogs(): Promise<RawLog[]> {
  const db = await getDb();
  const reminderLogs = await db.getAllAsync<RawLog>(
    "SELECT action, action_at FROM reminder_log WHERE action IN ('done','skipped')"
  );
  const exerciseLogs = await db.getAllAsync<RawLog>(
    "SELECT action, action_at FROM exercise_log WHERE action IN ('done','skipped')"
  );
  return [...reminderLogs, ...exerciseLogs];
}

function aggregateByDay(logs: RawLog[]): Map<string, { done: number; skipped: number }> {
  const map = new Map<string, { done: number; skipped: number }>();
  for (const log of logs) {
    const key = localDateKey(log.action_at);
    const entry = map.get(key) ?? { done: 0, skipped: 0 };
    if (log.action === 'done') entry.done += 1;
    else if (log.action === 'skipped') entry.skipped += 1;
    map.set(key, entry);
  }
  return map;
}

function toDailyStat(date: string, done: number, skipped: number): DailyStat {
  const total = done + skipped;
  return {
    date,
    completed_count: done,
    skipped_count: skipped,
    completion_rate: total === 0 ? 0 : done / total,
  };
}

/** Mirrors GET /stats/daily?range=week|month */
export async function getDailyStats(range: 'week' | 'month' = 'week'): Promise<DailyStat[]> {
  const logs = await getAllActionLogs();
  const byDay = aggregateByDay(logs);
  const days = range === 'week' ? 7 : 30;
  const result: DailyStat[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKeyFromDate(d);
    const entry = byDay.get(key) ?? { done: 0, skipped: 0 };
    result.push(toDailyStat(key, entry.done, entry.skipped));
  }
  return result;
}

/** Mirrors GET /stats/streak */
export async function getStreak(): Promise<StreakInfo> {
  const logs = await getAllActionLogs();
  const byDay = aggregateByDay(logs);

  const qualifies = (key: string): boolean => {
    const entry = byDay.get(key);
    if (!entry) return false;
    const total = entry.done + entry.skipped;
    if (total === 0 || entry.done === 0) return false;
    return entry.done / total >= STREAK_THRESHOLD;
  };

  // Current streak: walk backward from today.
  let current = 0;
  const cursor = new Date();
  // Allow today to be "incomplete" without breaking the streak: if today doesn't
  // qualify yet, start counting from yesterday.
  if (!qualifies(dateKeyFromDate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (qualifies(dateKeyFromDate(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Best streak across all recorded days.
  const keys = Array.from(byDay.keys()).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of keys) {
    if (!qualifies(key)) {
      run = 0;
      prev = null;
      continue;
    }
    const d = new Date(`${key}T00:00:00`);
    if (prev) {
      const diff = Math.round((d.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = d;
  }
  best = Math.max(best, current);

  return { current, best };
}

/** Mirrors GET /stats/heatmap?weeks= */
export async function getHeatmap(weeks = 16): Promise<HeatmapCell[]> {
  const logs = await getAllActionLogs();
  const byDay = aggregateByDay(logs);

  const today = new Date();
  // End on the upcoming Saturday so columns align to full weeks (Sun-Sat).
  const end = new Date(today);
  end.setDate(today.getDate() + (6 - today.getDay()));
  const totalDays = weeks * 7;

  const cells: HeatmapCell[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const key = dateKeyFromDate(d);
    const entry = byDay.get(key) ?? { done: 0, skipped: 0 };
    const total = entry.done + entry.skipped;
    const rate = total === 0 ? 0 : entry.done / total;
    let intensity = 0;
    if (total > 0) {
      if (rate >= 0.8) intensity = 4;
      else if (rate >= 0.6) intensity = 3;
      else if (rate >= 0.4) intensity = 2;
      else intensity = 1;
    }
    cells.push({
      date: key,
      completed_count: entry.done,
      skipped_count: entry.skipped,
      completion_rate: rate,
      intensity,
    });
  }
  return cells;
}

export async function getStatsSummary(): Promise<StatsSummary> {
  const weekly = await getDailyStats('week');
  const completedThisWeek = weekly.reduce((s, d) => s + d.completed_count, 0);
  const skippedThisWeek = weekly.reduce((s, d) => s + d.skipped_count, 0);

  const db = await getDb();
  const r = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM reminder_log WHERE action = 'done'"
  );
  const e = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM exercise_log WHERE action = 'done'"
  );
  return {
    completedThisWeek,
    skippedThisWeek,
    totalDone: (r?.c ?? 0) + (e?.c ?? 0),
  };
}

/**
 * Today's completion against the daily goal. Skipped prompts never count; once
 * the goal is reached, the goal grows to match the number completed so the
 * counter reads e.g. 6/6 instead of capping at the goal.
 */
export async function getTodayProgress(): Promise<{ done: number; goal: number }> {
  const logs = await getAllActionLogs();
  const todayKey = dateKeyFromDate(new Date());
  let done = 0;
  for (const log of logs) {
    if (localDateKey(log.action_at) === todayKey && log.action === 'done') {
      done += 1;
    }
  }
  const settings = await getReminderSettings();
  const goal = Math.max(settings.daily_goal, done);
  return { done, goal };
}

/** Done/skipped counts for a specific local date. */
export async function getProgressForDate(date: Date): Promise<{ done: number; skipped: number }> {
  const logs = await getAllActionLogs();
  const key = dateKeyFromDate(date);
  let done = 0;
  let skipped = 0;
  for (const log of logs) {
    if (localDateKey(log.action_at) === key) {
      if (log.action === 'done') done += 1;
      else if (log.action === 'skipped') skipped += 1;
    }
  }
  return { done, skipped };
}
