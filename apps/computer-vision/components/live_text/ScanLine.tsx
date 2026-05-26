import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const SWEEP_MS = 1400;
const GLOW_HEIGHT = 110;
const LINE_HEIGHT = 2;

type Props = {
  /** Canvas height in px — the sweep travels from 0 to this value. */
  height: number;
  /** Called once, on the JS thread, when the sweep finishes. */
  onSweepDone: () => void;
};

/**
 * Sweeps a soft aurora band top-to-bottom once, then pulses at the bottom.
 * Render this only while the scan is in progress; unmount it afterwards.
 * @param root0 - Component props.
 * @param root0.height - Canvas height the sweep travels across.
 * @param root0.onSweepDone - JS-thread callback fired once when the sweep ends.
 * @returns The animated scan-line overlay.
 */
export default function ScanLine({ height, onSweepDone }: Props) {
  const y = useSharedValue(0);
  const pulse = useSharedValue(1);

  const onSweepDoneRef = useRef(onSweepDone);
  useEffect(() => {
    onSweepDoneRef.current = onSweepDone;
  });

  useEffect(() => {
    const fireSweepDone = () => onSweepDoneRef.current();
    y.value = withTiming(
      height,
      { duration: SWEEP_MS, easing: Easing.inOut(Easing.ease) },
      (finished) => {
        'worklet';
        if (finished) {
          runOnJS(fireSweepDone)();
        }
      }
    );
    pulse.value = withDelay(
      SWEEP_MS,
      withRepeat(withTiming(0.35, { duration: 650 }), -1, true)
    );
  }, [height, y, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: pulse.value,
  }));

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[
          'rgba(125, 211, 252, 0)',
          'rgba(125, 211, 252, 0.25)',
          'rgba(167, 139, 250, 0.55)',
        ]}
        style={styles.glowTop}
      />
      <LinearGradient
        colors={[
          'rgba(167, 139, 250, 0.9)',
          '#F0F9FF',
          'rgba(125, 211, 252, 0.9)',
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.line}
      />
      <LinearGradient
        colors={[
          'rgba(167, 139, 250, 0.55)',
          'rgba(125, 211, 252, 0.25)',
          'rgba(125, 211, 252, 0)',
        ]}
        style={styles.glowBottom}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -GLOW_HEIGHT,
    height: GLOW_HEIGHT * 2 + LINE_HEIGHT,
    alignItems: 'stretch',
  },
  glowTop: {
    height: GLOW_HEIGHT,
  },
  line: {
    height: LINE_HEIGHT,
  },
  glowBottom: {
    height: GLOW_HEIGHT,
  },
});
