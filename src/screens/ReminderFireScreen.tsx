import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, Button, Icon, CheckmarkBurst } from '../components';
import { colors, fontSize, fontWeight, radii, spacing } from '../theme';
import type { ReminderType } from '../db/types';
import { getReminderType, logReminderAction } from '../services/reminders';
import { scheduleNextReminder, snoozeReminder } from '../notifications/scheduler';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ReminderFire'>;

export function ReminderFireScreen({ navigation, route }: Props) {
  const params = route.params;
  const [type, setType] = useState<ReminderType | null>(null);
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    (async () => {
      if (params?.reminderTypeId) {
        setType(await getReminderType(params.reminderTypeId));
      }
    })();
  }, [params?.reminderTypeId]);

  const close = () => navigation.goBack();

  const onDone = async () => {
    if (type) await logReminderAction(type.id, 'done', params?.scheduledAt);
    await scheduleNextReminder();
    setShowBurst(true);
  };

  const onSkip = async () => {
    if (type) await logReminderAction(type.id, 'skipped', params?.scheduledAt);
    await scheduleNextReminder();
    close();
  };

  const onSnooze = async () => {
    if (type) {
      await logReminderAction(type.id, 'snoozed', params?.scheduledAt);
      await snoozeReminder(type.id, type.name, type.description, 5);
    }
    close();
  };

  const isMovement = type?.icon_key === 'stand';

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      <Animated.View entering={SlideInDown.springify().damping(18)} style={styles.sheetWrap}>
        <Card style={styles.sheet}>
          {showBurst ? (
            <Animated.View entering={FadeIn} style={styles.burst}>
              <CheckmarkBurst onDone={close} />
              <Text style={styles.burstText}>Nice work!</Text>
            </Animated.View>
          ) : (
            <>
              <View style={styles.iconCircle}>
                <Icon name={type?.icon_key ?? 'bell'} size={32} color={colors.accentText} />
              </View>
              <Text style={styles.title}>{type?.name ?? 'Time for a break'}</Text>
              <Text style={styles.body}>
                {type?.description ?? 'Take a quick wellness moment.'}
              </Text>

              {isMovement ? (
                <Button
                  label="Stretch now"
                  icon="play"
                  variant="secondary"
                  style={styles.stretchButton}
                  onPress={() => {
                    navigation.replace('ExerciseRun', { random: true });
                  }}
                />
              ) : null}

              <Button label="Done" icon="check" onPress={onDone} style={styles.doneButton} />
              <View style={styles.secondaryRow}>
                <Button
                  label="Snooze 5 min"
                  variant="secondary"
                  onPress={onSnooze}
                  style={styles.flexButton}
                />
                <View style={{ width: spacing.md }} />
                <Button
                  label="Skip"
                  variant="ghost"
                  onPress={onSkip}
                  style={styles.flexButton}
                />
              </View>
            </>
          )}
        </Card>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    padding: spacing.lg,
  },
  sheet: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    borderRadius: radii.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    marginTop: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  stretchButton: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
  doneButton: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
  secondaryRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
  flexButton: {
    flex: 1,
  },
  burst: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  burstText: {
    marginTop: spacing.xl,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
});
