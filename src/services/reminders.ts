import { getDb } from '../db/client';
import type { ReminderAction, ReminderType } from '../db/types';

export async function getReminderTypes(): Promise<ReminderType[]> {
  const db = await getDb();
  return db.getAllAsync<ReminderType>('SELECT * FROM reminder_type ORDER BY sort_order ASC, id ASC');
}

export async function getEnabledReminderTypes(): Promise<ReminderType[]> {
  const db = await getDb();
  return db.getAllAsync<ReminderType>(
    'SELECT * FROM reminder_type WHERE is_enabled = 1 ORDER BY sort_order ASC, id ASC'
  );
}

export async function getReminderType(id: number): Promise<ReminderType | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ReminderType>('SELECT * FROM reminder_type WHERE id = ?', [id]);
  return row ?? null;
}

export async function createReminderType(input: {
  name: string;
  description?: string;
  icon_key?: string;
}): Promise<ReminderType> {
  const db = await getDb();
  const maxRow = await db.getFirstAsync<{ max: number | null }>(
    'SELECT MAX(sort_order) as max FROM reminder_type'
  );
  const sortOrder = (maxRow?.max ?? -1) + 1;
  const result = await db.runAsync(
    'INSERT INTO reminder_type (name, description, icon_key, is_enabled, sort_order) VALUES (?, ?, ?, 1, ?)',
    [input.name, input.description ?? '', input.icon_key ?? 'bell', sortOrder]
  );
  const row = await getReminderType(result.lastInsertRowId);
  return row as ReminderType;
}

export async function updateReminderType(
  id: number,
  input: { name?: string; description?: string; icon_key?: string; is_enabled?: boolean }
): Promise<ReminderType> {
  const db = await getDb();
  const current = await getReminderType(id);
  if (!current) throw new Error(`Reminder type ${id} not found`);
  await db.runAsync(
    'UPDATE reminder_type SET name = ?, description = ?, icon_key = ?, is_enabled = ? WHERE id = ?',
    [
      input.name ?? current.name,
      input.description ?? current.description,
      input.icon_key ?? current.icon_key,
      input.is_enabled !== undefined ? (input.is_enabled ? 1 : 0) : current.is_enabled,
      id,
    ]
  );
  return (await getReminderType(id)) as ReminderType;
}

export async function toggleReminderType(id: number, enabled: boolean): Promise<ReminderType> {
  return updateReminderType(id, { is_enabled: enabled });
}

export async function deleteReminderType(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM reminder_type WHERE id = ?', [id]);
}

/** Log an action on a fired reminder. Mirrors POST /reminders/{id}/done|skip|snooze */
export async function logReminderAction(
  reminderTypeId: number,
  action: ReminderAction,
  scheduledAt?: string
): Promise<void> {
  const db = await getDb();
  const scheduled = scheduledAt ?? new Date().toISOString();
  await db.runAsync(
    'INSERT INTO reminder_log (reminder_type_id, scheduled_at, action, action_at) VALUES (?, ?, ?, ?)',
    [reminderTypeId, scheduled, action, new Date().toISOString()]
  );
}
