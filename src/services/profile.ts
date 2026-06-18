import { getDb } from '../db/client';
import type { Profile } from '../db/types';

export async function getProfile(): Promise<Profile> {
  const db = await getDb();
  let row = await db.getFirstAsync<Profile>('SELECT * FROM profile ORDER BY id ASC LIMIT 1');
  if (!row) {
    await db.runAsync('INSERT INTO profile (name, photo_path) VALUES (NULL, NULL)');
    row = await db.getFirstAsync<Profile>('SELECT * FROM profile ORDER BY id ASC LIMIT 1');
  }
  return row as Profile;
}

export async function updateProfile(input: {
  name?: string | null;
  photo_path?: string | null;
}): Promise<Profile> {
  const db = await getDb();
  const current = await getProfile();
  const name = input.name !== undefined ? input.name : current.name;
  const photo = input.photo_path !== undefined ? input.photo_path : current.photo_path;
  await db.runAsync('UPDATE profile SET name = ?, photo_path = ? WHERE id = ?', [
    name,
    photo,
    current.id,
  ]);
  return getProfile();
}
