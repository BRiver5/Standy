import type { SQLiteDatabase } from 'expo-sqlite';

interface SeedReminderType {
  name: string;
  description: string;
  icon_key: string;
  sort_order: number;
}

const DEFAULT_REMINDER_TYPES: SeedReminderType[] = [
  { name: 'Stand up & move', description: 'Get up and stretch your legs for a moment.', icon_key: 'stand', sort_order: 0 },
  { name: 'Drink water', description: 'Take a sip and stay hydrated.', icon_key: 'water', sort_order: 1 },
  { name: 'Eye rest', description: 'Look 20 feet away for 20 seconds (20-20-20).', icon_key: 'eye', sort_order: 2 },
  { name: 'Posture check', description: 'Roll your shoulders back and sit tall.', icon_key: 'posture', sort_order: 3 },
];

interface SeedExercise {
  name: string;
  description: string;
  body_area: string;
  duration_seconds: number;
  media_key: string;
}

const STARTER_EXERCISES: SeedExercise[] = [
  {
    name: 'Neck Tilts',
    description: 'Slowly tilt your head toward each shoulder, holding gently at each side.',
    body_area: 'neck',
    duration_seconds: 30,
    media_key: 'neck',
  },
  {
    name: 'Neck Rotations',
    description: 'Turn your head slowly left and right, keeping your shoulders relaxed.',
    body_area: 'neck',
    duration_seconds: 30,
    media_key: 'neck',
  },
  {
    name: 'Shoulder Rolls',
    description: 'Roll your shoulders backward in slow, controlled circles.',
    body_area: 'shoulders',
    duration_seconds: 30,
    media_key: 'shoulders',
  },
  {
    name: 'Shoulder Shrugs',
    description: 'Lift your shoulders toward your ears, hold, then release.',
    body_area: 'shoulders',
    duration_seconds: 20,
    media_key: 'shoulders',
  },
  {
    name: 'Seated Back Twist',
    description: 'Sit tall and gently rotate your torso to each side.',
    body_area: 'back',
    duration_seconds: 40,
    media_key: 'back',
  },
  {
    name: 'Cat-Cow Stretch',
    description: 'Alternate arching and rounding your back to mobilize the spine.',
    body_area: 'back',
    duration_seconds: 45,
    media_key: 'back',
  },
  {
    name: '20-20-20 Eye Rest',
    description: 'Look at something 20 feet away for 20 seconds.',
    body_area: 'eyes',
    duration_seconds: 20,
    media_key: 'eyes',
  },
  {
    name: 'Eye Palming',
    description: 'Cover your closed eyes with your palms and breathe slowly.',
    body_area: 'eyes',
    duration_seconds: 30,
    media_key: 'eyes',
  },
  {
    name: 'Full Body Reach',
    description: 'Reach both arms overhead and lengthen your whole body.',
    body_area: 'full',
    duration_seconds: 25,
    media_key: 'stretch',
  },
];

export async function seedIfEmpty(db: SQLiteDatabase): Promise<void> {
  const profileRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM profile'
  );
  if ((profileRow?.count ?? 0) === 0) {
    await db.runAsync('INSERT INTO profile (name, photo_path) VALUES (NULL, NULL)');
  }

  const settingsRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM reminder_settings'
  );
  if ((settingsRow?.count ?? 0) === 0) {
    await db.runAsync(
      `INSERT INTO reminder_settings
        (interval_minutes, quiet_hours_start, quiet_hours_end, rotation_mode, last_type_index)
       VALUES (45, '22:00', '08:00', 'sequential', -1)`
    );
  }

  const typeRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM reminder_type'
  );
  if ((typeRow?.count ?? 0) === 0) {
    for (const t of DEFAULT_REMINDER_TYPES) {
      await db.runAsync(
        'INSERT INTO reminder_type (name, description, icon_key, is_enabled, sort_order) VALUES (?, ?, ?, 1, ?)',
        [t.name, t.description, t.icon_key, t.sort_order]
      );
    }
  }

  const exRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercise'
  );
  if ((exRow?.count ?? 0) === 0) {
    for (const e of STARTER_EXERCISES) {
      await db.runAsync(
        'INSERT INTO exercise (name, description, body_area, duration_seconds, media_key) VALUES (?, ?, ?, ?, ?)',
        [e.name, e.description, e.body_area, e.duration_seconds, e.media_key]
      );
    }
  }
}
