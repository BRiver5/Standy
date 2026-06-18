import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Screen,
  ScreenHeader,
  Card,
  ProgressRing,
  ExerciseMedia,
  Button,
  CheckmarkBurst,
  EntranceView,
} from '../components';
import { colors, fontSize, fontWeight, spacing } from '../theme';
import type { Exercise } from '../db/types';
import { getExercise, getRandomExercise, logExerciseAction } from '../services/exercises';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseRun'>;

const AREA_LABELS: Record<string, string> = {
  neck: 'Neck',
  shoulders: 'Shoulders',
  back: 'Back',
  eyes: 'Eyes',
  full: 'Full body',
};

export function ExerciseRunScreen({ navigation, route }: Props) {
  const params = route.params ?? {};
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      let ex: Exercise | null = null;
      if (params.exerciseId) {
        ex = await getExercise(params.exerciseId);
      } else {
        ex = await getRandomExercise(params.bodyArea ?? 'all');
      }
      if (ex) {
        setExercise(ex);
        setSecondsLeft(ex.duration_seconds);
        setRunning(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setRunning(false);
            setFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  const finish = useCallback(
    async (action: 'done' | 'skipped') => {
      if (exercise) {
        await logExerciseAction(exercise.id, action);
      }
      if (action === 'done') {
        setShowBurst(true);
      } else {
        navigation.goBack();
      }
    },
    [exercise, navigation]
  );

  const progress = exercise && exercise.duration_seconds > 0
    ? secondsLeft / exercise.duration_seconds
    : 0;

  if (!exercise) {
    return (
      <Screen scroll={false} contentStyle={styles.loadingWrap}>
        <ScreenHeader title="Exercise" onBack={() => navigation.goBack()} />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Finding an exercise...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <ScreenHeader title="Exercise" onBack={() => navigation.goBack()} />

      <EntranceView style={styles.section}>
        <Card style={styles.mediaCard}>
          <ExerciseMedia mediaKey={exercise.media_key} iconSize={88} showTag={false} />
        </Card>
      </EntranceView>

      <EntranceView index={1} style={styles.section}>
        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.area}>{AREA_LABELS[exercise.body_area] ?? exercise.body_area}</Text>
        <Text style={styles.description}>{exercise.description}</Text>
      </EntranceView>

      <EntranceView index={2} style={styles.ringSection}>
        <ProgressRing progress={progress} size={200} strokeWidth={12} durationMs={900}>
          <Text style={styles.timer}>{secondsLeft}</Text>
          <Text style={styles.timerLabel}>{finished ? 'COMPLETE' : 'SECONDS'}</Text>
        </ProgressRing>
      </EntranceView>

      <EntranceView index={3} style={styles.controls}>
        {!finished ? (
          <Button
            label={running ? 'Pause' : 'Resume'}
            variant="secondary"
            icon={running ? 'pause' : 'play'}
            onPress={() => setRunning((r) => !r)}
          />
        ) : null}
        <View style={styles.actionRow}>
          <Button
            label="Skip"
            variant="secondary"
            icon="skip"
            onPress={() => finish('skipped')}
            style={styles.flexButton}
          />
          <View style={{ width: spacing.md }} />
          <Button
            label="Done"
            icon="check"
            onPress={() => finish('done')}
            style={styles.flexButton}
          />
        </View>
      </EntranceView>

      {showBurst ? (
        <View style={styles.burstOverlay} pointerEvents="none">
          <CheckmarkBurst onDone={() => navigation.goBack()} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
  },
  loadingWrap: {
    paddingHorizontal: spacing.xl,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  mediaCard: {
    padding: spacing.xl,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  area: {
    marginTop: spacing.xs,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  description: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  ringSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  timer: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  timerLabel: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1,
  },
  controls: {
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
  },
  flexButton: {
    flex: 1,
  },
  burstOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,244,244,0.85)',
  },
});
