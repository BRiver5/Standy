import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { ReminderType } from '../db/types';
import { getEnabledReminderTypes } from '../services/reminders';
import { getReminderSettings, setLastTypeIndex } from '../services/settings';
import { computeNextFireTime } from './timeUtils';

const ANDROID_CHANNEL_ID = 'standy-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function configureNotifications(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Standy reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#000000',
      vibrationPattern: [0, 120, 80, 120],
    });
  }
  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.granted;
  if (!granted && settings.canAskAgain) {
    const request = await Notifications.requestPermissionsAsync();
    granted = request.granted;
  }
  return granted;
}

/**
 * Sequential rotation: pick the next enabled reminder type after the last one
 * used. Isolated so it can be swapped for random/weighted selection later.
 */
export function pickNextReminderType(
  types: ReminderType[],
  lastIndex: number,
  mode: 'sequential' | 'random'
): { type: ReminderType; index: number } | null {
  if (types.length === 0) return null;
  if (mode === 'random') {
    const index = Math.floor(Math.random() * types.length);
    return { type: types[index], index };
  }
  const index = (lastIndex + 1) % types.length;
  return { type: types[index], index };
}

export interface ScheduledReminder {
  notificationId: string;
  reminderTypeId: number;
  reminderTypeName: string;
  fireAt: string;
}

/** Cancel everything currently scheduled. */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Schedule the next reminder based on persisted settings. Cancels any existing
 * scheduled notifications first so there is always exactly one pending reminder.
 */
export async function scheduleNextReminder(
  from: Date = new Date()
): Promise<ScheduledReminder | null> {
  await cancelAllReminders();

  const [settings, enabledTypes] = await Promise.all([
    getReminderSettings(),
    getEnabledReminderTypes(),
  ]);

  if (enabledTypes.length === 0) return null;

  const picked = pickNextReminderType(enabledTypes, settings.last_type_index, settings.rotation_mode);
  if (!picked) return null;

  const dndUntil = settings.dnd_until ? new Date(settings.dnd_until) : null;
  const fireAt = computeNextFireTime({
    from,
    intervalMinutes: settings.interval_minutes,
    quiet: { start: settings.quiet_hours_start, end: settings.quiet_hours_end },
    dndUntil,
  });

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: picked.type.name,
      body: picked.type.description || 'Time for a quick wellness break.',
      data: { reminderTypeId: picked.type.id, scheduledAt: fireAt.toISOString() },
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
    },
  });

  await setLastTypeIndex(picked.index);

  return {
    notificationId,
    reminderTypeId: picked.type.id,
    reminderTypeName: picked.type.name,
    fireAt: fireAt.toISOString(),
  };
}

/** Reschedule the same reminder type N minutes from now (snooze). */
export async function snoozeReminder(
  reminderTypeId: number,
  reminderTypeName: string,
  description: string,
  minutes = 5
): Promise<ScheduledReminder> {
  const fireAt = new Date(Date.now() + minutes * 60 * 1000);
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: reminderTypeName,
      body: description || 'Snoozed reminder — time for your break now.',
      data: { reminderTypeId, scheduledAt: fireAt.toISOString() },
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
    },
  });
  return {
    notificationId,
    reminderTypeId,
    reminderTypeName,
    fireAt: fireAt.toISOString(),
  };
}

/** Returns the soonest pending reminder, if any. */
export async function getNextScheduled(): Promise<ScheduledReminder | null> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  if (scheduled.length === 0) return null;

  const mapped = scheduled
    .map((n) => {
      const data = (n.content.data ?? {}) as { reminderTypeId?: number; scheduledAt?: string };
      return {
        notificationId: n.identifier,
        reminderTypeId: data.reminderTypeId ?? -1,
        reminderTypeName: n.content.title ?? 'Reminder',
        fireAt: data.scheduledAt ?? new Date().toISOString(),
      } as ScheduledReminder;
    })
    .sort((a, b) => new Date(a.fireAt).getTime() - new Date(b.fireAt).getTime());

  return mapped[0] ?? null;
}
