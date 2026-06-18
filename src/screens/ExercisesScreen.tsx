import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Screen,
  ScreenHeader,
  Card,
  Icon,
  ExerciseMedia,
  SegmentedControl,
  PressableScale,
  EntranceView,
  type SegmentOption,
} from '../components';
import { colors, fontSize, fontWeight, radii, spacing } from '../theme';
import type { BodyArea, Exercise } from '../db/types';
import { getExercises } from '../services/exercises';
import type { TabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Exercises'>,
  NativeStackScreenProps<RootStackParamList>
>;

type FilterValue = BodyArea | 'all';

const FILTERS: SegmentOption<FilterValue>[] = [
  { label: 'All', value: 'all' },
  { label: 'Neck', value: 'neck' },
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Back', value: 'back' },
  { label: 'Eyes', value: 'eyes' },
  { label: 'Full body', value: 'full' },
];

const AREA_LABELS: Record<string, string> = {
  neck: 'Neck',
  shoulders: 'Shoulders',
  back: 'Back',
  eyes: 'Eyes',
  full: 'Full body',
};

export function ExercisesScreen({ navigation }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');

  const load = useCallback(async () => {
    const rows = await getExercises({ body_area: filter, search });
    setExercises(rows);
  }, [filter, search]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen withTabBar onRefresh={load}>
      <ScreenHeader title="Exercises" rightIcon="filter" />

      <EntranceView style={styles.section}>
        <Card padded={false} style={styles.searchBox}>
          <Icon name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </Card>
      </EntranceView>

      <EntranceView index={1} style={styles.section}>
        <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />
      </EntranceView>

      <View style={styles.grid}>
        {exercises.map((ex, i) => (
          <EntranceView key={ex.id} index={i} style={styles.gridItem}>
            <PressableScale
              onPress={() => navigation.navigate('ExerciseRun', { exerciseId: ex.id })}
            >
              <Card style={styles.exerciseCard}>
                <ExerciseMedia mediaKey={ex.media_key} iconSize={44} />
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {ex.name}
                </Text>
                <Text style={styles.exerciseArea}>{AREA_LABELS[ex.body_area] ?? ex.body_area}</Text>
                <View style={styles.metaRow}>
                  <Icon name="timer" size={13} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{ex.duration_seconds} sec</Text>
                </View>
              </Card>
            </PressableScale>
          </EntranceView>
        ))}
      </View>

      {exercises.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="search" size={28} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No exercises match your search.</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 52,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl - spacing.sm,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  exerciseCard: {
    padding: spacing.md,
  },
  exerciseName: {
    marginTop: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  exerciseArea: {
    marginTop: 2,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
