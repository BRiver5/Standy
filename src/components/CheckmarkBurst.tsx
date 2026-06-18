import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors, radii } from '../theme';
import { Icon } from './Icon';

export interface CheckmarkBurstProps {
  size?: number;
  onDone?: () => void;
}

export function CheckmarkBurst({ size = 96, onDone }: CheckmarkBurstProps) {
  const scale = useSharedValue(0);
  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.15, { duration: 280, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 160 }, (finished) => {
        if (finished && onDone) {
          runOnJS(onDone)();
        }
      })
    );
    ringScale.value = withTiming(1.6, { duration: 520, easing: Easing.out(Easing.cubic) });
    ringOpacity.value = withDelay(80, withTiming(0, { duration: 440 }));
  }, [scale, ringScale, ringOpacity, onDone]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <Animated.View style={styles.wrap}>
      <Animated.View
        style={[
          styles.ring,
          { width: size, height: size, borderRadius: size / 2 },
          ringStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2 },
          circleStyle,
        ]}
      >
        <Icon name="check" size={size * 0.5} color={colors.accentText} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.accent,
  },
});
