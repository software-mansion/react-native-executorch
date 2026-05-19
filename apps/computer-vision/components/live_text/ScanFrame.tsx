import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const ACCENT = '#FFD60A';
const CORNER = 34;
const THICKNESS = 4;
const RADIUS = 10;
const INSET = 24;

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
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
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
