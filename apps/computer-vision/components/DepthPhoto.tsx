import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Circle,
  FilterMode,
  ImageShader,
  Rect,
  Shader,
  Skia,
  type SkImage,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../theme';
import { DEPTH_PHOTO_SHADER } from './depthPhotoShader';

const EFFECT = Skia.RuntimeEffect.Make(DEPTH_PHOTO_SHADER);
const MODES = ['3D Photo', 'Focus', 'Depth', 'Original'] as const;
const AMOUNTS = [
  { label: 'Subtle', value: 0.45 },
  { label: 'Medium', value: 0.85 },
  { label: 'Strong', value: 1.3 },
];

// Applies interactive depth effects to an existing photograph without rerunning inference.
export function DepthPhoto({ image, depthTexture }: { image: SkImage; depthTexture: SkImage }) {
  const { width: windowWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [mode, setMode] = useState(0);
  const [amount, setAmount] = useState(0.85);
  const [playing, setPlaying] = useState(!reducedMotion);
  const phase = useSharedValue(0);
  const interaction = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const focusX = useSharedValue(0.5);
  const focusY = useSharedValue(0.5);

  const width = Math.max(1, windowWidth - 32);
  const height = Math.min(
    width * 1.25,
    Math.max(width * 0.7, (width * image.height()) / image.width())
  );
  const scale = Math.min(width / image.width(), height / image.height());
  const imageWidth = image.width() * scale;
  const imageHeight = image.height() * scale;
  const x = (width - imageWidth) / 2;
  const y = (height - imageHeight) / 2;
  const imageRect = { x, y, width: imageWidth, height: imageHeight };

  useEffect(() => {
    if (playing && mode === 0) {
      phase.value = withRepeat(
        withTiming(phase.value + Math.PI * 2, {
          duration: 12000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      cancelAnimation(phase);
    }
    return () => cancelAnimation(phase);
  }, [playing, mode, phase]);

  const uniforms = useDerivedValue(() => {
    const autoX = Math.sin(phase.value) * 0.7;
    const autoY = Math.cos(phase.value) * 0.35;
    return {
      origin: [x, y],
      size: [imageWidth, imageHeight],
      tilt: [
        autoX * (1 - interaction.value) + tiltX.value * interaction.value,
        autoY * (1 - interaction.value) + tiltY.value * interaction.value,
      ],
      focus: [focusX.value, focusY.value],
      amount,
      mode,
    };
  });
  const focusCx = useDerivedValue(() => x + focusX.value * imageWidth);
  const focusCy = useDerivedValue(() => y + focusY.value * imageHeight);

  const pan = Gesture.Pan()
    .enabled(mode === 0)
    .activeOffsetX([-4, 4])
    .failOffsetY([-20, 20])
    .onStart((event) => {
      interaction.value = withTiming(1, { duration: 100 });
      tiltX.value = Math.max(-1, Math.min(1, ((event.x - x) / imageWidth) * 2 - 1));
      tiltY.value = Math.max(-1, Math.min(1, ((event.y - y) / imageHeight) * 2 - 1));
    })
    .onUpdate((event) => {
      tiltX.value = Math.max(-1, Math.min(1, ((event.x - x) / imageWidth) * 2 - 1));
      tiltY.value = Math.max(-1, Math.min(1, ((event.y - y) / imageHeight) * 2 - 1));
    })
    .onFinalize(() => {
      interaction.value = withTiming(0, { duration: 500 });
    });
  const tap = Gesture.Tap()
    .enabled(mode === 1)
    .onEnd((event, success) => {
      if (
        !success ||
        event.x < x ||
        event.x > x + imageWidth ||
        event.y < y ||
        event.y > y + imageHeight
      )
        return;
      focusX.value = (event.x - x) / imageWidth;
      focusY.value = (event.y - y) / imageHeight;
    });

  if (!EFFECT) {
    return <Text style={styles.hint}>Depth effects are unavailable on this renderer.</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>DEPTH PLAYGROUND</Text>
        <Text style={styles.title}>
          {mode === 0
            ? 'A little perspective.'
            : mode === 1
              ? 'Find your focus.'
              : mode === 2
                ? 'Beneath the surface.'
                : 'The starting point.'}
        </Text>
      </View>
      <View style={styles.tabs}>
        {MODES.map((label, index) => (
          <Pressable
            key={label}
            onPress={() => setMode(index)}
            style={[styles.tab, mode === index && styles.activeTab]}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === index }}
          >
            <Text style={[styles.tabText, mode === index && styles.activeTabText]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <GestureHandlerRootView style={[styles.frame, { width, height }]}>
        <GestureDetector gesture={Gesture.Race(pan, tap)}>
          <Canvas style={{ width, height }} accessibilityLabel={MODES[mode]}>
            <Rect rect={imageRect}>
              <Shader source={EFFECT} uniforms={uniforms}>
                <ImageShader
                  image={image}
                  fit="fill"
                  rect={imageRect}
                  tx="clamp"
                  ty="clamp"
                  sampling={{ filter: FilterMode.Linear }}
                />
                <ImageShader
                  image={depthTexture}
                  fit="fill"
                  rect={imageRect}
                  tx="clamp"
                  ty="clamp"
                  sampling={{ filter: FilterMode.Linear }}
                />
              </Shader>
            </Rect>
            {mode === 1 && (
              <Circle
                cx={focusCx}
                cy={focusCy}
                r={15}
                color="white"
                style="stroke"
                strokeWidth={2}
              />
            )}
          </Canvas>
        </GestureDetector>
      </GestureHandlerRootView>
      <Text style={styles.hint}>
        {mode === 0
          ? 'Drag sideways to shift your perspective. Nearer surfaces move more.'
          : mode === 1
            ? 'Tap a subject to keep its depth in focus and soften the rest.'
            : mode === 2
              ? 'Cool colors are farther away. Warm colors are closer.'
              : 'Your original photo, without any depth effects.'}
      </Text>
      {mode < 2 && (
        <View style={styles.controls}>
          <View style={styles.amounts}>
            {AMOUNTS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => setAmount(item.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: amount === item.value }}
                style={[styles.amount, amount === item.value && styles.selectedAmount]}
              >
                <Text style={styles.amountText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          {mode === 0 && (
            <Pressable
              onPress={() => setPlaying(!playing)}
              accessibilityRole="button"
              style={styles.playButton}
            >
              <Text style={styles.playText}>{playing ? 'Pause' : 'Animate'}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 20 },
  heading: { marginBottom: 14 },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 5,
  },
  title: {
    fontSize: 25,
    color: theme.colors.strongPrimary,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  tabs: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#E6E9EF',
    marginBottom: 12,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  activeTab: { backgroundColor: theme.colors.strongPrimary },
  tabText: { color: '#596579', fontWeight: '600', fontSize: 12 },
  activeTabText: { color: '#FFFFFF' },
  frame: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#080F22' },
  hint: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 12,
  },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  amounts: { flexDirection: 'row', gap: 4 },
  amount: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 8 },
  selectedAmount: { backgroundColor: '#DDE6FA' },
  amountText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
  playButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: theme.colors.strongPrimary,
  },
  playText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});
