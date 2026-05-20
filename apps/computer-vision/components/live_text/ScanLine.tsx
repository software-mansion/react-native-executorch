import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
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

const ACCENT = '#FFD60A';
const SWEEP_MS = 1400;
const GLOW_HEIGHT = 90;
const LINE_HEIGHT = 3;

type Props = {
  /** Canvas height in px — the sweep travels from 0 to this value. */
  height: number;
  /** Called once, on the JS thread, when the sweep finishes. */
  onSweepDone: () => void;
};

/**
 * Sweeps a glowing line top-to-bottom once, then pulses at the bottom.
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
        colors={['rgba(255,214,10,0)', 'rgba(255,214,10,0.28)']}
        style={styles.glowTop}
      />
      <View style={styles.line} />
      <LinearGradient
        colors={['rgba(255,214,10,0.28)', 'rgba(255,214,10,0)']}
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
    backgroundColor: ACCENT,
  },
  glowBottom: {
    height: GLOW_HEIGHT,
  },
});
