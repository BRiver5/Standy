import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, spacing } from '../theme';

export interface BarDatum {
  label: string;
  completed: number;
  skipped: number;
}

export interface BarChartProps {
  data: BarDatum[];
  height?: number;
}

export function BarChart({ data, height = 150 }: BarChartProps) {
  const maxTotal = Math.max(1, ...data.map((d) => d.completed + d.skipped));

  return (
    <View>
      <View style={[styles.row, { height }]}>
        {data.map((d, i) => {
          const total = d.completed + d.skipped;
          const totalH = (total / maxTotal) * height;
          const completedH = total === 0 ? 0 : (d.completed / total) * totalH;
          const skippedH = totalH - completedH;
          return (
            <View key={`${d.label}-${i}`} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { height: Math.max(totalH, total > 0 ? 8 : 4) }]}>
                  {skippedH > 0 ? (
                    <View style={[styles.skipped, { height: skippedH }]} />
                  ) : null}
                  <View
                    style={[
                      styles.completed,
                      { height: completedH, flex: completedH > 0 ? undefined : 0 },
                    ]}
                  />
                  {total === 0 ? <View style={styles.empty} /> : null}
                </View>
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <View key={`label-${d.label}-${i}`} style={styles.labelCell}>
            <Text style={styles.labelText}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barTrack: {
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: 14,
    borderRadius: 7,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: colors.track,
  },
  completed: {
    width: '100%',
    backgroundColor: colors.accent,
  },
  skipped: {
    width: '100%',
    backgroundColor: colors.skipped,
  },
  empty: {
    width: '100%',
    height: 4,
    backgroundColor: colors.track,
  },
  labels: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  labelCell: {
    flex: 1,
    alignItems: 'center',
  },
  labelText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
});
