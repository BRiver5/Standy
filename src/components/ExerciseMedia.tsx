import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, fontSize, fontWeight, radii, spacing } from '../theme';
import { Icon } from './Icon';

export interface ExerciseMediaProps {
  mediaKey: string;
  size?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  showTag?: boolean;
}

export function ExerciseMedia({
  mediaKey,
  size,
  iconSize = 48,
  style,
  showTag = true,
}: ExerciseMediaProps) {
  return (
    <View style={[styles.box, size ? { height: size } : null, style]}>
      <Icon name={mediaKey} size={iconSize} color={colors.textSecondary} />
      {showTag ? (
        <View style={styles.tag}>
          <Text style={styles.tagText}>GIF</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    width: '100%',
  },
  tag: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
  },
  tagText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
});
