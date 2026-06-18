import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Screen,
  ScreenHeader,
  Card,
  StatCard,
  BarChart,
  Heatmap,
  EntranceView,
  type BarDatum,
  type HeatmapDatum,
} from '../components';
import { colors, fontSize, fontWeight, radii, spacing } from '../theme';
import {
  getDailyStats,
  getStreak,
  getStatsSummary,
  getHeatmap,
  type StatsSummary,
} from '../services/stats';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function weekdayLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00`);
  return WEEKDAY_LABELS[d.getDay()];
}

function formatCellDate(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function StatsScreen() {
  const [bars, setBars] = useState<BarDatum[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapDatum[]>([]);
  const [streak, setStreak] = useState({ current: 0, best: 0 });
  const [summary, setSummary] = useState<StatsSummary>({
    completedThisWeek: 0,
    skippedThisWeek: 0,
    totalDone: 0,
  });
  const [selected, setSelected] = useState<HeatmapDatum | null>(null);

  const load = useCallback(async () => {
    const daily = await getDailyStats('week');
    setBars(
      daily.map((d) => ({
        label: weekdayLabel(d.date),
        completed: d.completed_count,
        skipped: d.skipped_count,
      }))
    );
    setHeatmap(await getHeatmap(16));
    setStreak(await getStreak());
    setSummary(await getStatsSummary());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen withTabBar onRefresh={load}>
      <ScreenHeader title="Your Stats" rightIcon="share" />

      <EntranceView style={styles.statsRow}>
        <StatCard
          icon="flame"
          label="Weekly Streak"
          value={`${streak.current} ${streak.current === 1 ? 'Day' : 'Days'}`}
        />
        <View style={{ width: spacing.lg }} />
        <StatCard icon="done" label="Total Done" value={`${summary.totalDone}`} />
      </EntranceView>

      <EntranceView index={1} style={styles.section}>
        <Card style={styles.card}>
          <View style={styles.legendRow}>
            <Text style={styles.cardTitle}>Daily Completion</Text>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: colors.accent }]} />
                <Text style={styles.legendText}>Done</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: colors.skipped }]} />
                <Text style={styles.legendText}>Skipped</Text>
              </View>
            </View>
          </View>
          <BarChart data={bars} />
          <Text style={styles.weekSummary}>
            This week: <Text style={styles.bold}>{summary.completedThisWeek} done</Text> /{' '}
            {summary.skippedThisWeek} skipped
          </Text>
        </Card>
      </EntranceView>

      <EntranceView index={2} style={styles.section}>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Activity Heatmap</Text>
          <View style={styles.heatmapWrap}>
            <Heatmap data={heatmap} onCellPress={setSelected} />
          </View>
          {selected ? (
            <View style={styles.detail}>
              <Text style={styles.detailDate}>{formatCellDate(selected.date)}</Text>
              <Text style={styles.detailText}>
                {selected.completed_count} done · {selected.skipped_count} skipped
                {selected.completed_count + selected.skipped_count > 0
                  ? ` · ${Math.round(selected.completion_rate * 100)}%`
                  : ''}
              </Text>
            </View>
          ) : (
            <Text style={styles.detailHint}>Tap a day to see its summary.</Text>
          )}
        </Card>
      </EntranceView>

      <EntranceView index={3} style={styles.section}>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Best Streak</Text>
          <Text style={styles.bestStreak}>
            {streak.best} {streak.best === 1 ? 'day' : 'days'}
          </Text>
          <Text style={styles.detailHint}>
            A day counts toward your streak when you complete at least 80% of that day's prompts.
          </Text>
        </Card>
      </EntranceView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  card: {
    paddingVertical: spacing.xl,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  weekSummary: {
    marginTop: spacing.xl,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  bold: {
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
  },
  heatmapWrap: {
    marginTop: spacing.xl,
  },
  detail: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: radii.md,
  },
  detailDate: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  detailText: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  detailHint: {
    marginTop: spacing.lg,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bestStreak: {
    marginTop: spacing.sm,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});
