import { getDb } from '../db/client';
import type { ReminderSettings, RotationMode } from '../db/types';

export async function getReminderSettings(): Promise<ReminderSettings> {
  const db = await getDb();
  let row = await db.getFirstAsync<ReminderSettings>(
    'SELECT * FROM reminder_settings ORDER BY id ASC LIMIT 1'
  );
  if (!row) {
    await db.runAsync(
      `INSERT INTO reminder_settings (interval_minutes, rotation_mode, last_type_index)
       VALUES (45, 'sequential', -1)`
    );
    row = await db.getFirstAsync<ReminderSettings>(
      'SELECT * FROM reminder_settings ORDER BY id ASC LIMIT 1'
    );
  }
  return row as ReminderSettings;
}

export async function updateReminderSettings(input: {
  interval_minutes?: number;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  dnd_until?: string | null;
  rotation_mode?: RotationMode;
  daily_goal?: number;
}): Promise<ReminderSettings> {
  const db = await getDb();
  const current = await getReminderSettings();
  const merged = {
    interval_minutes: input.interval_minutes ?? current.interval_minutes,
    quiet_hours_start:
      input.quiet_hours_start !== undefined ? input.quiet_hours_start : current.quiet_hours_start,
    quiet_hours_end:
      input.quiet_hours_end !== undefined ? input.quiet_hours_end : current.quiet_hours_end,
    dnd_until: input.dnd_until !== undefined ? input.dnd_until : current.dnd_until,
    rotation_mode: input.rotation_mode ?? current.rotation_mode,
    daily_goal: input.daily_goal ?? current.daily_goal,
  };
  await db.runAsync(
    `UPDATE reminder_settings
       SET interval_minutes = ?, quiet_hours_start = ?, quiet_hours_end = ?, dnd_until = ?, rotation_mode = ?, daily_goal = ?
     WHERE id = ?`,
    [
      merged.interval_minutes,
      merged.quiet_hours_start,
      merged.quiet_hours_end,
      merged.dnd_until,
      merged.rotation_mode,
      merged.daily_goal,
      current.id,
    ]
  );
  return getReminderSettings();
}

export async function setLastTypeIndex(index: number): Promise<void> {
  const db = await getDb();
  const current = await getReminderSettings();
  await db.runAsync('UPDATE reminder_settings SET last_type_index = ? WHERE id = ?', [
    index,
    current.id,
  ]);
}

/** Enable Do Not Disturb for a number of minutes from now. Pass null to clear. */
export async function setDnd(minutes: number | null): Promise<ReminderSettings> {
  if (minutes === null) {
    return updateReminderSettings({ dnd_until: null });
  }
  const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  return updateReminderSettings({ dnd_until: until });
}
