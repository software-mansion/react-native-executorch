import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import ColorPalette from '../colors';

export default function AnimatedChatLoading() {
  const progress = useSharedValue(0);
  progress.value = withRepeat(withTiming(1, { duration: 500 }), -1, true);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [
          ColorPalette.seaBlueLight,
          ColorPalette.seaBlueMedium,
          ColorPalette.seaBlueDark,
        ]
      ),
    };
  });

  return (
    <View style={styles.messageLoadingContainer}>
      <Animated.View style={[styles.loadingDot, animatedStyle]} />
      <Animated.View style={[styles.loadingDot, animatedStyle]} />
      <Animated.View style={[styles.loadingDot, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  messageLoadingContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
