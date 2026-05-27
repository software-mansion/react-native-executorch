import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { StylePreset } from '../assets/presets';

type Props = {
  activePreset: StylePreset;
  pendingPreset: StylePreset;
  activeLayerStyle: object;
  pendingLayerStyle: object;
  gradientIntensity: number;
  horizontalMargin: number;
};

function blendColors(c1: string, c2: string, ratio: number): string {
  const r1 = Number.parseInt(c1.slice(1, 3), 16);
  const g1 = Number.parseInt(c1.slice(3, 5), 16);
  const b1 = Number.parseInt(c1.slice(5, 7), 16);
  const r2 = Number.parseInt(c2.slice(1, 3), 16);
  const g2 = Number.parseInt(c2.slice(3, 5), 16);
  const b2 = Number.parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function renderGradient(p: StylePreset, intensity: number, margin: number) {
  const blendedTop = blendColors(
    p.ui.gradientTop,
    p.ui.containerBackground,
    1 - intensity
  );
  return (
    <LinearGradient
      colors={[blendedTop, p.ui.containerBackground]}
      style={[
        StyleSheet.absoluteFill,
        styles.flagContainer,
        { paddingHorizontal: margin },
      ]}
    />
  );
}

export default function GradientBackground({
  activePreset,
  pendingPreset,
  activeLayerStyle,
  pendingLayerStyle,
  gradientIntensity,
  horizontalMargin,
}: Props) {
  return (
    <>
      <Animated.View
        style={[StyleSheet.absoluteFill, activeLayerStyle]}
        pointerEvents="none"
      >
        {renderGradient(activePreset, gradientIntensity, horizontalMargin)}
      </Animated.View>
      <Animated.View
        style={[StyleSheet.absoluteFill, pendingLayerStyle]}
        pointerEvents="none"
      >
        {renderGradient(pendingPreset, gradientIntensity, horizontalMargin)}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  flagContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
