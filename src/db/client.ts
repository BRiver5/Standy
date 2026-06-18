import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { createSchema } from './schema';
import { seedIfEmpty } from './seed';

const DB_NAME = 'standy.db';

let dbPromise: Promise<SQLiteDatabase> | null = null;

async function init(): Promise<SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await createSchema(db);
  await seedIfEmpty(db);
  return db;
}

export function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = init();
  }
  return dbPromise;
}
