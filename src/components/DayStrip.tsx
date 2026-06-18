import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, radii, shadows, spacing } from '../theme';
import { PressableScale } from './PressableScale';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const OFFSETS = [-2, -1, 0, 1, 2];

export interface DayStripProps {
  /** Offset from today of the highlighted day (0 = today). */
  selectedOffset?: number;
  /** Called with the offset of the tapped day (negative = past, positive = future). */
  onSelect?: (offset: number) => void;
}

export function DayStrip({ selectedOffset = 0, onSelect }: DayStripProps) {
  const today = new Date().getDay();

  return (
    <View style={styles.container}>
      {OFFSETS.map((offset) => {
        const dayIndex = (today + offset + 7) % 7;
        const isActive = offset === selectedOffset;
        return (
          <PressableScale
            key={offset}
            onPress={() => onSelect?.(offset)}
            style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
          >
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
              {DAY_LABELS[dayIndex]}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    ...shadows.soft,
  },
  pill: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.accent,
  },
  pillInactive: {
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.5,
  },
  labelActive: {
    color: colors.accentText,
  },
  labelInactive: {
    color: colors.textSecondary,
  },
});
