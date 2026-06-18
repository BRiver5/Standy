import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, radii, shadows, spacing } from '../theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

export interface ScreenHeaderProps {
  title?: string;
  onBack?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
  greetingTop?: string;
  greetingBottom?: string;
}

function CircleButton({ icon, onPress }: { icon: string; onPress?: () => void }) {
  return (
    <PressableScale style={styles.circleButton} onPress={onPress} hitSlop={8}>
      <Icon name={icon} size={20} color={colors.textPrimary} />
    </PressableScale>
  );
}

export function ScreenHeader({
  title,
  onBack,
  rightIcon,
  onRightPress,
  greetingTop,
  greetingBottom,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {onBack ? <CircleButton icon="back_arrow" onPress={onBack} /> : null}
        {greetingTop || greetingBottom ? (
          <View style={onBack ? styles.greetingWithBack : undefined}>
            {greetingTop ? <Text style={styles.greetingTop}>{greetingTop}</Text> : null}
            {greetingBottom ? <Text style={styles.greetingBottom}>{greetingBottom}</Text> : null}
          </View>
        ) : null}
      </View>

      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View />
      )}

      <View style={styles.sideRight}>
        {rightIcon ? <CircleButton icon={rightIcon} onPress={onRightPress} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sideRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 44,
  },
  greetingWithBack: {
    marginLeft: spacing.md,
  },
  greetingTop: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  greetingBottom: {
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    flex: 1,
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
});
