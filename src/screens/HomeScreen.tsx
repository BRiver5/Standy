import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Screen,
  Card,
  ProgressRing,
  StatCard,
  DayStrip,
  Icon,
  PressableScale,
  EntranceView,
} from '../components';
import { colors, fontSize, fontWeight, radii, shadows, spacing } from '../theme';
import { getProfile } from '../services/profile';
import { getReminderSettings } from '../services/settings';
import {
  getStreak,
  getStatsSummary,
  getTodayProgress,
  getProgressForDate,
} from '../services/stats';
import { scheduleNextReminder, getNextScheduled, ScheduledReminder } from '../notifications/scheduler';
import type { TabParamList } from '../navigation/types';
import type { RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${`${minutes}`.padStart(2, '0')}:${`${seconds}`.padStart(2, '0')}`;
}

function dayLabel(offset: number): string {
  if (offset === 0) return 'Today';
  if (offset === -1) return 'Yesterday';
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return WEEKDAY_FULL[d.getDay()];
}

export function HomeScreen({ navigation }: Props) {
  const [name, setName] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [next, setNext] = useState<ScheduledReminder | null>(null);
  const [intervalMs, setIntervalMs] = useState(45 * 60 * 1000);
  const [todayProgress, setTodayProgress] = useState({ done: 0, goal: 5 });
  const [streak, setStreak] = useState(0);
  const [totalDone, setTotalDone] = useState(0);
  const [nowTick, setNowTick] = useState(Date.now());
  const [selectedOffset, setSelectedOffset] = useState(0);
  const [daySummary, setDaySummary] = useState<{ done: number; skipped: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const profile = await getProfile();
    setName(profile.name);
    setPhoto(profile.photo_path);

    const settings = await getReminderSettings();
    setIntervalMs(settings.interval_minutes * 60 * 1000);

    let scheduled = await getNextScheduled();
    if (!scheduled) {
      scheduled = await scheduleNextReminder();
    }
    setNext(scheduled);

    setTodayProgress(await getTodayProgress());
    const streakInfo = await getStreak();
    setStreak(streakInfo.current);
    const summary = await getStatsSummary();
    setTotalDone(summary.totalDone);
  }, []);

  const loadDaySummary = useCallback(async (offset: number) => {
    if (offset > 0) {
      setDaySummary(null);
      return;
    }
    const date = new Date();
    date.setDate(date.getDate() + offset);
    setDaySummary(await getProgressForDate(date));
  }, []);

  const onSelectDay = useCallback(
    (offset: number) => {
      setSelectedOffset(offset);
      loadDaySummary(offset);
    },
    [loadDaySummary]
  );

  useFocusEffect(
    useCallback(() => {
      load();
      loadDaySummary(selectedOffset);
    }, [load, loadDaySummary, selectedOffset])
  );

  useEffect(() => {
    timerRef.current = setInterval(() => setNowTick(Date.now()), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fireAtMs = next ? new Date(next.fireAt).getTime() : 0;
  const remainingMs = next ? Math.max(0, fireAtMs - nowTick) : 0;
  const progress = next ? Math.max(0, Math.min(1, 1 - remainingMs / intervalMs)) : 0;

  const greetingName = name && name.length > 0 ? name : 'there';

  return (
    <Screen withTabBar onRefresh={load}>
      <EntranceView>
        <View style={styles.header}>
          <PressableScale
            style={styles.headerLeft}
            onPress={() => navigation.navigate('Profile')}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="stand" size={22} color={colors.textSecondary} />
              </View>
            )}
            <View style={styles.greeting}>
              <Text style={styles.greetingTop}>Hello,</Text>
              <Text style={styles.greetingName} numberOfLines={1}>
                {greetingName}
              </Text>
            </View>
          </PressableScale>
          <PressableScale
            style={styles.circleButton}
            onPress={() => navigation.navigate('Exercises')}
          >
            <Icon name="search" size={20} color={colors.textPrimary} />
          </PressableScale>
        </View>
      </EntranceView>

      <EntranceView index={1} style={styles.section}>
        <DayStrip selectedOffset={selectedOffset} onSelect={onSelectDay} />
        <Text style={styles.daySummary}>
          {selectedOffset > 0
            ? `${dayLabel(selectedOffset)} - upcoming`
            : `${dayLabel(selectedOffset)} - ${daySummary?.done ?? 0} done, ${
                daySummary?.skipped ?? 0
              } skipped`}
        </Text>
      </EntranceView>

      <EntranceView index={2} style={styles.section}>
        <Card style={styles.ringCard}>
          <ProgressRing progress={progress} size={230} strokeWidth={14}>
            <Text style={styles.countdown}>{formatCountdown(remainingMs)}</Text>
            <Text style={styles.untilLabel}>
              {next ? 'UNTIL NEXT REMINDER' : 'NO REMINDER SCHEDULED'}
            </Text>
            <Text style={styles.reminderName}>{next ? next.reminderTypeName : 'Enable a type'}</Text>
          </ProgressRing>

          <View style={styles.ringFooter}>
            <View style={styles.footerIcons}>
              <Icon name="snooze" size={18} color={colors.textSecondary} />
              <View style={styles.footerActive}>
                <Icon name="water" size={18} color={colors.accentText} />
              </View>
              <Icon name="timer" size={18} color={colors.textSecondary} />
            </View>
            <Text style={styles.todayText}>
              Today: <Text style={styles.todayBold}>{todayProgress.done}</Text>/
              {todayProgress.goal} Done
            </Text>
          </View>
        </Card>
      </EntranceView>

      <EntranceView index={3} style={styles.statsRow}>
        <StatCard icon="flame" label="Current Streak" value={`${streak} ${streak === 1 ? 'Day' : 'Days'}`} />
        <View style={{ width: spacing.lg }} />
        <StatCard icon="done" label="Total Done" value={`${totalDone}`} />
      </EntranceView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  greeting: {
    marginLeft: spacing.md,
    flex: 1,
  },
  greetingTop: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  greetingName: {
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  daySummary: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  ringCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  countdown: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  untilLabel: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.5,
  },
  reminderName: {
    marginTop: spacing.xs,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  ringFooter: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  footerActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  todayBold: {
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
});
