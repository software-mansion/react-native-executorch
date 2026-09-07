import { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import ColorPalette from '../colors';

interface AudioWaveformProps {
  buffer: Float32Array | null | undefined;
  style?: StyleProp<ViewStyle>;
}

const NUM_BARS = 32;

export default function AudioWaveform({ buffer, style }: AudioWaveformProps) {
  const bars = useMemo(() => {
    if (!buffer || buffer.length === 0) return null;
    const chunkSize = Math.max(1, Math.floor(buffer.length / NUM_BARS));
    const peaks: number[] = [];
    let max = 0;
    for (let i = 0; i < NUM_BARS; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, buffer.length);
      let peak = 0;
      for (let j = start; j < end; j++) {
        const v = Math.abs(buffer[j] ?? 0);
        if (v > peak) peak = v;
      }
      peaks.push(peak);
      if (peak > max) max = peak;
    }
    return max > 0 ? peaks.map((p) => p / max) : peaks;
  }, [buffer]);

  if (!bars) return null;

  return (
    <View style={[styles.container, style]}>
      {bars.map((amp, i) => (
        <View key={i} style={[styles.bar, { height: 2 + amp * 14 }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
    minWidth: 160,
    gap: 2,
  },
  bar: {
    flex: 1,
    borderRadius: 1,
    backgroundColor: ColorPalette.blueDark,
    opacity: 0.35,
  },
});
