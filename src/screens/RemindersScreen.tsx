import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Screen,
  ScreenHeader,
  Card,
  Icon,
  SegmentedControl,
  PressableScale,
  EntranceView,
} from '../components';
import { colors, fontSize, fontWeight, radii, spacing } from '../theme';
import type { ReminderSettings, ReminderType } from '../db/types';
import { getReminderTypes, toggleReminderType } from '../services/reminders';
import { getReminderSettings, updateReminderSettings, setDnd } from '../services/settings';
import { getDndMinutes, setDndMinutes } from '../services/meta';
import { scheduleNextReminder } from '../notifications/scheduler';

const INTERVAL_OPTIONS = [
  { label: '30 min', value: '30' },
  { label: '45 min', value: '45' },
  { label: '60 min', value: '60' },
  { label: '90 min', value: '90' },
];

const GOAL_OPTIONS = [
  { label: '3', value: '3' },
  { label: '5', value: '5' },
  { label: '8', value: '8' },
  { label: '10', value: '10' },
];

const QUIET_PRESETS = [
  { label: 'Off', value: 'off' },
  { label: '22:00 - 08:00', value: '22:00|08:00' },
  { label: '23:00 - 07:00', value: '23:00|07:00' },
  { label: '21:00 - 09:00', value: '21:00|09:00' },
];

function dndLabel(until: string | null, now: number): string | null {
  if (!until) return null;
  const ms = new Date(until).getTime() - now;
  if (ms <= 0) return null;
  const mins = Math.ceil(ms / 60000);
  return `Paused for ${mins} more min`;
}

export function RemindersScreen() {
  const [types, setTypes] = useState<ReminderType[]>([]);
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [dndMinutes, setDndMinutesState] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setTypes(await getReminderTypes());
    setSettings(await getReminderSettings());
    setDndMinutesState(await getDndMinutes());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    tickRef.current = setInterval(() => setNowTick(Date.now()), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const reschedule = useCallback(async () => {
    await scheduleNextReminder();
  }, []);

  const onToggleType = async (type: ReminderType, value: boolean) => {
    setTypes((prev) =>
      prev.map((t) => (t.id === type.id ? { ...t, is_enabled: value ? 1 : 0 } : t))
    );
    await toggleReminderType(type.id, value);
    await reschedule();
  };

  const onIntervalChange = async (value: string) => {
    const minutes = Number(value);
    const updated = await updateReminderSettings({ interval_minutes: minutes });
    setSettings(updated);
    await reschedule();
  };

  const onGoalChange = async (value: string) => {
    const updated = await updateReminderSettings({ daily_goal: Number(value) });
    setSettings(updated);
  };

  const onQuietChange = async (value: string) => {
    if (value === 'off') {
      const updated = await updateReminderSettings({
        quiet_hours_start: null,
        quiet_hours_end: null,
      });
      setSettings(updated);
    } else {
      const [start, end] = value.split('|');
      const updated = await updateReminderSettings({
        quiet_hours_start: start,
        quiet_hours_end: end,
      });
      setSettings(updated);
    }
    await reschedule();
  };

  const onDnd = async (minutes: number | null) => {
    const updated = await setDnd(minutes);
    setSettings(updated);
    await setDndMinutes(minutes);
    setDndMinutesState(minutes);
    await reschedule();
  };

  const quietValue =
    settings?.quiet_hours_start && settings?.quiet_hours_end
      ? `${settings.quiet_hours_start}|${settings.quiet_hours_end}`
      : 'off';

  const dndActive = !!dndLabel(settings?.dnd_until ?? null, nowTick);

  return (
    <Screen withTabBar onRefresh={load}>
      <ScreenHeader title="Reminders" rightIcon="settings" />

      <EntranceView style={styles.section}>
        <Text style={styles.sectionTitle}>Remind me every</Text>
        <Card padded style={styles.card}>
          <SegmentedControl
            options={INTERVAL_OPTIONS}
            value={`${settings?.interval_minutes ?? 45}`}
            onChange={onIntervalChange}
          />
        </Card>
      </EntranceView>

      <EntranceView index={1} style={styles.section}>
        <Text style={styles.sectionTitle}>Daily goal</Text>
        <Card padded style={styles.card}>
          <View style={styles.quietHeader}>
            <Icon name="done" size={18} color={colors.textSecondary} />
            <Text style={styles.quietHint}>How many breaks to complete each day</Text>
          </View>
          <SegmentedControl
            options={GOAL_OPTIONS}
            value={`${settings?.daily_goal ?? 5}`}
            onChange={onGoalChange}
          />
        </Card>
      </EntranceView>

      <EntranceView index={2} style={styles.section}>
        <Text style={styles.sectionTitle}>Reminder types</Text>
        {types.map((type) => (
          <Card key={type.id} padded={false} style={styles.typeRow}>
            <View style={styles.typeThumb}>
              <Icon name={type.icon_key} size={22} color={colors.textPrimary} />
            </View>
            <View style={styles.typeBody}>
              <Text style={styles.typeName}>{type.name}</Text>
              <Text style={styles.typeDesc} numberOfLines={1}>
                {type.description}
              </Text>
            </View>
            <Switch
              value={type.is_enabled === 1}
              onValueChange={(v) => onToggleType(type, v)}
              trackColor={{ true: colors.accent, false: colors.trackAlt }}
              thumbColor={colors.card}
              ios_backgroundColor={colors.trackAlt}
            />
          </Card>
        ))}
      </EntranceView>

      <EntranceView index={3} style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet hours</Text>
        <Card padded style={styles.card}>
          <View style={styles.quietHeader}>
            <Icon name="moon" size={18} color={colors.textSecondary} />
            <Text style={styles.quietHint}>No reminders fire during this window</Text>
          </View>
          <SegmentedControl options={QUIET_PRESETS} value={quietValue} onChange={onQuietChange} />
        </Card>
      </EntranceView>

      <EntranceView index={4} style={styles.section}>
        <Text style={styles.sectionTitle}>Do Not Disturb</Text>
        <Card padded style={styles.card}>
          {dndActive ? (
            <Text style={styles.dndActive}>{dndLabel(settings?.dnd_until ?? null, nowTick)}</Text>
          ) : (
            <Text style={styles.quietHint}>Pause reminders when you're in a call or focused.</Text>
          )}
          <View style={styles.dndRow}>
            <DndButton
              label="30 min"
              onPress={() => onDnd(30)}
              active={dndActive && dndMinutes === 30}
            />
            <DndButton
              label="60 min"
              onPress={() => onDnd(60)}
              active={dndActive && dndMinutes === 60}
            />
            <DndButton label="Resume" onPress={() => onDnd(null)} active={!dndActive} />
          </View>
        </Card>
      </EntranceView>
    </Screen>
  );
}

function DndButton({
  label,
  onPress,
  active,
}: {
  label: string;
  onPress: () => void;
  active: boolean;
}) {
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.dndButton, active ? styles.dndButtonActive : styles.dndButtonInactive]}
    >
      <Text style={[styles.dndButtonText, active ? styles.dndButtonTextActive : null]}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  card: {
    paddingVertical: spacing.md,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  typeThumb: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBody: {
    flex: 1,
    marginHorizontal: spacing.lg,
  },
  typeName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  typeDesc: {
    marginTop: 2,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  quietHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  quietHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  dndActive: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  dndRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dndButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  dndButtonActive: {
    backgroundColor: colors.accent,
  },
  dndButtonInactive: {
    backgroundColor: colors.background,
  },
  dndButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  dndButtonTextActive: {
    color: colors.accentText,
  },
});
