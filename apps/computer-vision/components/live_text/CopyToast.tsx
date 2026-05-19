import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';

type Props = {
  /** The copied text to show. Empty string renders nothing. */
  message: string;
};

/**
 * Render this with a changing `key` (e.g. a copy counter) so each copy
 * remounts the component and replays the fade-in / hold / fade-out.
 * @param root0 - Component props.
 * @param root0.message - The copied text to show. Empty string renders nothing.
 * @returns Animated toast pill, or null when message is empty.
 */
export default function CopyToast({ message }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSequence(
      withTiming(1, { duration: 180 }),
      withDelay(1200, withTiming(0, { duration: 320 }))
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 12 }],
  }));

  if (!message) return null;

  return (
    <Animated.View style={[styles.toast, animatedStyle]} pointerEvents="none">
      <Text style={styles.text} numberOfLines={1}>
        Copied "{message}"
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    alignSelf: 'center',
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
