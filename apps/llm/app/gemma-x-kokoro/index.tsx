import React, { useState, useRef, useEffect } from 'react';
import { PaperProvider, FAB } from 'react-native-paper';
import {
  View,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { presets, presetOrder, buildTheme } from '../../assets/presets';
import GradientBackground from '../../components/GradientBackground';
import FlagLayer from '../../components/FlagLayer';
import ThemedTextInput, {
  type ThemedTextInputHandle,
} from '../../components/ThemedTextInput';

// ---------------------------------------------------------------------------
// BACKGROUND VISIBILITY — tweak these to control intensity of gradient & flag
// ---------------------------------------------------------------------------
const GRADIENT_INTENSITY = 1.0; // gradient top visibility (0 = flat, 1 = full)
const FLAG_OPACITY = 0.05; // background flag watermark opacity (0–1)
const FLAG_FONT_SIZE = 360; // emoji flag pixel size
const FLAG_H_MARGIN = 0; // horizontal margin from screen edges (px)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ANIMATION PARAMETERS — control the preset-switching transition animation
// ----------------------------------------------x-----------------------------
const ANIM_DURATION = 800; // total crossfade duration (ms)
// ---------------------------------------------------------------------------

function computeFlagOpacity(
  flagId: string,
  activeId: string,
  pendingId: string | null,
  progress: number
): number {
  'worklet';
  let base = 0;
  if (pendingId === flagId) {
    base = progress;
  } else if (activeId === flagId) {
    base = pendingId ? 1 - progress : 1;
  }
  return base * FLAG_OPACITY;
}

function GemmaXKokoroScreen() {
  const [text, setText] = useState('');
  const [fabOpen, setFabOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState(presetOrder[0]);
  const [pendingPresetId, setPendingPresetId] = useState<string | null>(null);
  const [pressedFABId, setPressedFABId] = useState<string | null>(null);
  const isAnimating = useRef(false);
  const animProgress = useSharedValue(1);
  const backdropProgress = useSharedValue(0);
  const inputRef = useRef<ThemedTextInputHandle>(null);

  const activeIdSV = useSharedValue(presetOrder[0]);
  const pendingIdSV = useSharedValue<string | null>(null);

  const insets = useSafeAreaInsets();

  const activePreset = presets[activePresetId];
  const pendingPreset = pendingPresetId
    ? presets[pendingPresetId]
    : activePreset;
  const theme = buildTheme(activePreset);

  const activeLayerStyle = useAnimatedStyle(() => ({
    opacity: pendingIdSV.value ? 1 - animProgress.value : 1,
  }));

  const pendingLayerStyle = useAnimatedStyle(() => ({
    opacity: pendingIdSV.value ? animProgress.value : 0,
  }));

  const flagStyles: Record<string, ReturnType<typeof useAnimatedStyle>> = {
    us: useAnimatedStyle(() => ({
      opacity: computeFlagOpacity(
        'us',
        activeIdSV.value,
        pendingIdSV.value,
        animProgress.value
      ),
    })),
    es: useAnimatedStyle(() => ({
      opacity: computeFlagOpacity(
        'es',
        activeIdSV.value,
        pendingIdSV.value,
        animProgress.value
      ),
    })),
    fr: useAnimatedStyle(() => ({
      opacity: computeFlagOpacity(
        'fr',
        activeIdSV.value,
        pendingIdSV.value,
        animProgress.value
      ),
    })),
    in: useAnimatedStyle(() => ({
      opacity: computeFlagOpacity(
        'in',
        activeIdSV.value,
        pendingIdSV.value,
        animProgress.value
      ),
    })),
    pl: useAnimatedStyle(() => ({
      opacity: computeFlagOpacity(
        'pl',
        activeIdSV.value,
        pendingIdSV.value,
        animProgress.value
      ),
    })),
    de: useAnimatedStyle(() => ({
      opacity: computeFlagOpacity(
        'de',
        activeIdSV.value,
        pendingIdSV.value,
        animProgress.value
      ),
    })),
  };

  const triggerTransition = (newId: string) => {
    if (newId === activePresetId) return;
    if (isAnimating.current) return;
    isAnimating.current = true;

    setPendingPresetId(newId);
    pendingIdSV.value = newId;
    animProgress.value = 0;
    animProgress.value = withTiming(
      1,
      { duration: ANIM_DURATION, easing: Easing.inOut(Easing.ease) },
      (finished) => {
        if (finished) {
          runOnJS(onTransitionComplete)(newId);
        }
      }
    );
  };

  const onTransitionComplete = (newId: string) => {
    setActivePresetId(newId);
    setPendingPresetId(null);
    isAnimating.current = false;
  };

  useEffect(() => {
    activeIdSV.value = activePresetId;
  }, [activePresetId, activeIdSV]);

  useEffect(() => {
    pendingIdSV.value = pendingPresetId;
  }, [pendingPresetId, pendingIdSV]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropProgress.value,
  }));

  useEffect(() => {
    backdropProgress.value = withTiming(fabOpen ? 1 : 0, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
  }, [fabOpen, backdropProgress]);

  const fabActions = presetOrder.map((id) => {
    const p = presets[id];
    const isPressed = pressedFABId === id;
    return {
      icon: 'flag',
      label: `${p.flag} ${p.label}`,
      color: isPressed ? '#FFFFFF' : p.ui.fabBackground,
      onPress: () => {
        setPressedFABId(id);
        triggerTransition(p.id);
        setFabOpen(false);
        setTimeout(() => setPressedFABId(null), 300);
      },
    };
  });

  return (
    <PaperProvider theme={theme}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
          <GradientBackground
            activePreset={activePreset}
            pendingPreset={pendingPreset}
            activeLayerStyle={activeLayerStyle}
            pendingLayerStyle={pendingLayerStyle}
            gradientIntensity={GRADIENT_INTENSITY}
            horizontalMargin={FLAG_H_MARGIN}
          />

          <FlagLayer flagStyles={flagStyles} flagFontSize={FLAG_FONT_SIZE} />

          <ThemedTextInput
            ref={inputRef}
            text={text}
            onChangeText={setText}
            activePreset={activePreset}
            pendingPreset={pendingPreset}
            activeLayerStyle={activeLayerStyle}
            pendingLayerStyle={pendingLayerStyle}
          />

          <Pressable
            style={styles.content}
            onPress={() => {
              inputRef.current?.blur();
              Keyboard.dismiss();
            }}
          />

          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: activePreset.paperTheme.backdrop },
              backdropStyle,
            ]}
            pointerEvents={fabOpen ? 'auto' : 'none'}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setFabOpen(false)}
            />
          </Animated.View>
          <Animated.View
            style={[StyleSheet.absoluteFill, activeLayerStyle]}
            pointerEvents="box-none"
          >
            <FAB.Group
              open={fabOpen}
              visible={true}
              icon={fabOpen ? 'close' : 'dots-horizontal'}
              actions={fabActions}
              onStateChange={({ open }) => setFabOpen(open)}
              style={styles.fabGroup}
              fabStyle={{
                backgroundColor: activePreset.ui.fabBackground,
                borderRadius: 28,
              }}
              color={activePreset.ui.fabIcon}
              backdropColor="transparent"
            />
          </Animated.View>
          <Animated.View
            style={[StyleSheet.absoluteFill, pendingLayerStyle]}
            pointerEvents="box-none"
          >
            <FAB.Group
              open={fabOpen}
              visible={true}
              icon={fabOpen ? 'close' : 'dots-horizontal'}
              actions={fabActions}
              onStateChange={({ open }) => setFabOpen(open)}
              style={styles.fabGroup}
              fabStyle={{
                backgroundColor: pendingPreset.ui.fabBackground,
                borderRadius: 28,
              }}
              color={pendingPreset.ui.fabIcon}
              backdropColor="transparent"
            />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </PaperProvider>
  );
}

export default function GemmaXKokoroWrapper() {
  const isFocused = useIsFocused();
  return isFocused ? <GemmaXKokoroScreen /> : null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  fabGroup: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
});
