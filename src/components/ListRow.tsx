import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, radii, spacing } from '../theme';
import { Card } from './Card';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

export interface ListRowProps {
  iconKey: string;
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  rightIcon?: string;
  rightElement?: React.ReactNode;
}

export function ListRow({
  iconKey,
  title,
  subtitle,
  meta,
  onPress,
  rightIcon = 'chevron',
  rightElement,
}: ListRowProps) {
  return (
    <PressableScale onPress={onPress} disabled={!onPress}>
      <Card style={styles.card} padded={false}>
        <View style={styles.thumb}>
          <Icon name={iconKey} size={24} color={colors.textPrimary} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>
        <View style={styles.right}>
          {rightElement ?? <Icon name={rightIcon} size={20} color={colors.textSecondary} />}
        </View>
      </Card>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  meta: {
    marginTop: 4,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  right: {
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
});
