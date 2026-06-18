export type BodyArea = 'neck' | 'shoulders' | 'back' | 'eyes' | 'full';

export type ReminderAction = 'done' | 'skipped' | 'snoozed';
export type ExerciseAction = 'done' | 'skipped';
export type RotationMode = 'sequential' | 'random';

export interface Profile {
  id: number;
  name: string | null;
  photo_path: string | null;
  created_at: string;
}

export interface ReminderType {
  id: number;
  name: string;
  description: string;
  icon_key: string;
  is_enabled: number;
  sort_order: number;
}

export interface ReminderSettings {
  id: number;
  interval_minutes: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  dnd_until: string | null;
  rotation_mode: RotationMode;
  last_type_index: number;
  daily_goal: number;
}

export interface ReminderLog {
  id: number;
  reminder_type_id: number;
  scheduled_at: string;
  action: ReminderAction;
  action_at: string;
}

export interface Exercise {
  id: number;
  name: string;
  description: string;
  body_area: BodyArea;
  duration_seconds: number;
  media_key: string;
}

export interface ExerciseLog {
  id: number;
  exercise_id: number;
  scheduled_at: string;
  action: ExerciseAction;
  action_at: string;
}
