import { getDb } from '../db/client';
import type { BodyArea, Exercise, ExerciseAction } from '../db/types';

export async function getExercises(filter?: {
  body_area?: BodyArea | 'all';
  search?: string;
}): Promise<Exercise[]> {
  const db = await getDb();
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filter?.body_area && filter.body_area !== 'all') {
    clauses.push('body_area = ?');
    params.push(filter.body_area);
  }
  if (filter?.search && filter.search.trim().length > 0) {
    clauses.push('(name LIKE ? OR description LIKE ?)');
    const like = `%${filter.search.trim()}%`;
    params.push(like, like);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return db.getAllAsync<Exercise>(`SELECT * FROM exercise ${where} ORDER BY name ASC`, params);
}

export async function getExercise(id: number): Promise<Exercise | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Exercise>('SELECT * FROM exercise WHERE id = ?', [id]);
  return row ?? null;
}

export async function getRandomExercise(bodyArea?: BodyArea | 'all'): Promise<Exercise | null> {
  const db = await getDb();
  if (bodyArea && bodyArea !== 'all') {
    const row = await db.getFirstAsync<Exercise>(
      'SELECT * FROM exercise WHERE body_area = ? ORDER BY RANDOM() LIMIT 1',
      [bodyArea]
    );
    if (row) return row;
  }
  const any = await db.getFirstAsync<Exercise>('SELECT * FROM exercise ORDER BY RANDOM() LIMIT 1');
  return any ?? null;
}

export async function logExerciseAction(
  exerciseId: number,
  action: ExerciseAction,
  scheduledAt?: string
): Promise<void> {
  const db = await getDb();
  const scheduled = scheduledAt ?? new Date().toISOString();
  await db.runAsync(
    'INSERT INTO exercise_log (exercise_id, scheduled_at, action, action_at) VALUES (?, ?, ?, ?)',
    [exerciseId, scheduled, action, new Date().toISOString()]
  );
}
