import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const ACCENT = '#7DD3FC';
const CORNER = 32;
const THICKNESS = 2;
const RADIUS = 14;
const INSET = 32;

type CornerKey = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

const cornerStyles: Record<CornerKey, object> = {
  topLeft: {
    top: INSET,
    left: INSET,
    borderTopWidth: THICKNESS,
    borderLeftWidth: THICKNESS,
    borderTopLeftRadius: RADIUS,
  },
  topRight: {
    top: INSET,
    right: INSET,
    borderTopWidth: THICKNESS,
    borderRightWidth: THICKNESS,
    borderTopRightRadius: RADIUS,
  },
  bottomLeft: {
    bottom: INSET,
    left: INSET,
    borderBottomWidth: THICKNESS,
    borderLeftWidth: THICKNESS,
    borderBottomLeftRadius: RADIUS,
  },
  bottomRight: {
    bottom: INSET,
    right: INSET,
    borderBottomWidth: THICKNESS,
    borderRightWidth: THICKNESS,
    borderBottomRightRadius: RADIUS,
  },
};

export default function ScanFrame() {
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.85, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, animatedStyle]}
      pointerEvents="none"
    >
      {(Object.keys(cornerStyles) as CornerKey[]).map((key) => (
        <Animated.View key={key} style={[styles.corner, cornerStyles[key]]} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: ACCENT,
  },
});
