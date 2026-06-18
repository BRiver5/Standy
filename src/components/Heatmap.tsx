import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontWeight, spacing } from '../theme';
import { PressableScale } from './PressableScale';

export interface HeatmapDatum {
  date: string;
  intensity: number;
  completed_count: number;
  skipped_count: number;
  completion_rate: number;
}

export interface HeatmapProps {
  /** Flat list, oldest first, length = weeks * 7, starting on a Sunday. */
  data: HeatmapDatum[];
  onCellPress?: (cell: HeatmapDatum) => void;
}

const INTENSITY_COLORS = ['#ECECEC', '#C9C9C9', '#9A9A9A', '#5A5A5A', '#1A1A1A'];
const DAY_ROW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Heatmap({ data, onCellPress }: HeatmapProps) {
  const weeks = Math.ceil(data.length / 7);
  const columns: HeatmapDatum[][] = [];
  for (let w = 0; w < weeks; w++) {
    columns.push(data.slice(w * 7, w * 7 + 7));
  }

  return (
    <View style={styles.container}>
      <View style={styles.rowLabels}>
        {DAY_ROW_LABELS.map((label, i) => (
          <Text key={label} style={[styles.rowLabel, i % 2 === 0 ? styles.rowLabelVisible : null]}>
            {i % 2 === 0 ? label : ''}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {columns.map((col, ci) => (
          <View key={`col-${ci}`} style={styles.column}>
            {col.map((cell, ri) => (
              <PressableScale
                key={`${cell.date}-${ri}`}
                scaleTo={0.85}
                onPress={() => onCellPress?.(cell)}
                style={[
                  styles.cell,
                  { backgroundColor: INTENSITY_COLORS[Math.min(cell.intensity, 4)] },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const CELL = 13;
const GAP = 3;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  rowLabels: {
    marginRight: spacing.sm,
    justifyContent: 'space-between',
  },
  rowLabel: {
    height: CELL + GAP,
    fontSize: 9,
    lineHeight: CELL,
    color: 'transparent',
  },
  rowLabelVisible: {
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  grid: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
  column: {
    justifyContent: 'flex-start',
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 3,
    marginBottom: GAP,
  },
});
