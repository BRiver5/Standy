import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export interface EntranceViewProps {
  children: React.ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
  distance?: number;
}

/** Fade + slight upward translate entrance for cards and list items. */
export function EntranceView({ children, index = 0, style, distance = 16 }: EntranceViewProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * 60,
      withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) })
    );
  }, [progress, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
