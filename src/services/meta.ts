import { getDb } from '../db/client';

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}

export async function isOnboarded(): Promise<boolean> {
  return (await getMeta('onboarded')) === '1';
}

export async function setOnboarded(): Promise<void> {
  await setMeta('onboarded', '1');
}

/** The DND duration the user last chose (so the matching button can highlight). */
export async function getDndMinutes(): Promise<number | null> {
  const value = await getMeta('dnd_minutes');
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function setDndMinutes(minutes: number | null): Promise<void> {
  await setMeta('dnd_minutes', minutes === null ? '' : `${minutes}`);
}
