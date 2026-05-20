import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

type Props = {
  wordCount: number;
  inferenceMs: number;
  empty: boolean;
};

/**
 * Result pill that springs in after the reveal completes.
 * @param root0 - Component props.
 * @param root0.wordCount - Number of recognized words.
 * @param root0.inferenceMs - Measured OCR inference time in milliseconds.
 * @param root0.empty - When true, shows a "no text" message instead of counts.
 * @returns The animated result badge.
 */
export default function ResultBadge({ wordCount, inferenceMs, empty }: Props) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 140 });
    opacity.value = withTiming(1, { duration: 200 });
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.badge, animatedStyle]} pointerEvents="none">
      <Text style={styles.text}>
        {empty
          ? 'No text found'
          : `${wordCount} ${wordCount === 1 ? 'word' : 'words'} · ${inferenceMs} ms`}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
