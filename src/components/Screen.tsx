import React from 'react';
import { View, ScrollView, StyleSheet, StyleProp, ViewStyle, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

export interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  /** Reserve space for the floating bottom tab bar. */
  withTabBar?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const TAB_BAR_SPACE = 110;

export function Screen({
  children,
  scroll = true,
  withTabBar = false,
  contentStyle,
  refreshing,
  onRefresh,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = (withTabBar ? TAB_BAR_SPACE : spacing.xl) + (withTabBar ? 0 : insets.bottom);

  const padding = {
    paddingTop: insets.top + spacing.sm,
    paddingBottom: bottomPad,
  };

  if (!scroll) {
    return <View style={[styles.container, padding, contentStyle]}>{children}</View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[padding, contentStyle]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textSecondary}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
