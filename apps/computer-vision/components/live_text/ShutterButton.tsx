import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  variant: 'shutter' | 'again';
  onPress: () => void;
};

export default function ShutterButton({ variant, onPress }: Props) {
  // A single 0→1 driver feeds both scale and opacity, so the ring's
  // expand-and-fade stays in sync without a second animation racing.
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (variant !== 'shutter') return;
    pulse.value = withRepeat(
      withTiming(1, { duration: 1700, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, [variant, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.4 }],
  }));

  if (variant === 'again') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.againPill, pressed && styles.pressed]}
      >
        <Text style={styles.againText}>Scan again</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.shutterWrap}>
      <Animated.View
        style={[styles.pulseRing, ringStyle]}
        pointerEvents="none"
      />
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Scan"
        style={({ pressed }) => [
          styles.shutterOuter,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.shutterInner} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    transform: [{ scale: 0.92 }],
  },
  shutterWrap: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor: '#7DD3FC',
  },
  shutterOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#7DD3FC',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 0.55,
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
  },
  againPill: {
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#7DD3FC',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.4,
  },
  againText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
