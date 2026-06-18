import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, radii, shadows, spacing } from '../theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

const TAB_ICONS: Record<string, string> = {
  Home: 'home',
  Reminders: 'reminders',
  Exercises: 'exercises',
  Stats: 'stats',
};

function TabButton({
  routeName,
  isFocused,
  onPress,
}: {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(isFocused ? 1 : 0.92);

  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1.1 : 0.92, { damping: 12, stiffness: 220 });
  }, [isFocused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <PressableScale onPress={onPress} style={styles.tabButton} hitSlop={10}>
      <Animated.View style={animatedStyle}>
        <Icon
          name={TAB_ICONS[routeName] ?? 'home'}
          size={24}
          color={isFocused ? colors.accentText : '#8E8E8E'}
        />
      </Animated.View>
    </PressableScale>
  );
}

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const onTabPress = (routeName: string, routeKey: string, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const routes = state.routes;
  const half = Math.ceil(routes.length / 2);
  const leftRoutes = routes.slice(0, half);
  const rightRoutes = routes.slice(half);

  const onFabPress = () => {
    navigation.getParent()?.navigate('ExerciseRun', { random: true });
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={styles.bar}>
        <View style={styles.group}>
          {leftRoutes.map((route) => {
            const isFocused = state.index === state.routes.indexOf(route);
            return (
              <TabButton
                key={route.key}
                routeName={route.name}
                isFocused={isFocused}
                onPress={() => onTabPress(route.name, route.key, isFocused)}
              />
            );
          })}
        </View>

        <View style={styles.fabSpacer} />

        <View style={styles.group}>
          {rightRoutes.map((route) => {
            const isFocused = state.index === state.routes.indexOf(route);
            return (
              <TabButton
                key={route.key}
                routeName={route.name}
                isFocused={isFocused}
                onPress={() => onTabPress(route.name, route.key, isFocused)}
              />
            );
          })}
        </View>
      </View>

      <PressableScale style={styles.fab} onPress={onFabPress}>
        <Icon name="play" size={26} color={colors.accentText} />
      </PressableScale>
    </View>
  );
}

const BAR_HEIGHT = 64;
const FAB_SIZE = 60;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: BAR_HEIGHT,
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    ...shadows.floating,
  },
  group: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  fabSpacer: {
    width: FAB_SIZE,
  },
  tabButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    top: -FAB_SIZE / 2 + 6,
    alignSelf: 'center',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: colors.background,
    ...shadows.floating,
  },
});
