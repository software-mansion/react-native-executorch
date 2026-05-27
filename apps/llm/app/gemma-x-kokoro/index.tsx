import React, { useState, useRef, useEffect } from 'react';
import { PaperProvider, TextInput, FAB } from 'react-native-paper';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { presets, presetOrder, buildTheme } from './presets';

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
// ---------------------------------------------------------------------------
const ANIM_DURATION = 600; // total crossfade duration (ms)
// ---------------------------------------------------------------------------

function blendColors(c1: string, c2: string, ratio: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

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
  const isAnimating = useRef(false);
  const animProgress = useSharedValue(1);

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

  const fabActions = presetOrder.map((id) => {
    const p = presets[id];
    return {
      icon: 'flag',
      label: `${p.flag} ${p.label}`,
      color: p.ui.fabBackground,
      onPress: () => {
        triggerTransition(p.id);
        setFabOpen(false);
      },
    };
  });

  const renderGradient = (p: typeof activePreset) => {
    const blendedTop = blendColors(
      p.ui.gradientTop,
      p.ui.containerBackground,
      1 - GRADIENT_INTENSITY
    );
    return (
      <LinearGradient
        colors={[blendedTop, p.ui.containerBackground]}
        style={[
          StyleSheet.absoluteFill,
          styles.flagContainer,
          { paddingHorizontal: FLAG_H_MARGIN },
        ]}
      />
    );
  };

  const renderTextInput = (p: typeof activePreset) => (
    <TextInput
      mode="outlined"
      value={text}
      onChangeText={setText}
      placeholder={p.ui.placeholder}
      placeholderTextColor={p.ui.inputPlaceholder}
      style={[{ backgroundColor: p.ui.inputBackground }]}
      textColor={p.ui.inputText}
      outlineColor={p.ui.inputOutline}
      activeOutlineColor={p.ui.inputActiveOutline}
      cursorColor={p.ui.inputCursor}
      selectionColor={p.ui.inputSelection}
      right={
        <TextInput.Icon
          icon="arrow-up-circle"
          color={p.ui.inputIcon}
          onPress={() => text && setText('')}
        />
      }
    />
  );

  return (
    <PaperProvider theme={theme}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
          <Animated.View style={[StyleSheet.absoluteFill, activeLayerStyle]}>
            {renderGradient(activePreset)}
          </Animated.View>
          <Animated.View
            style={[StyleSheet.absoluteFill, pendingLayerStyle]}
            pointerEvents="none"
          >
            {renderGradient(pendingPreset)}
          </Animated.View>

          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {presetOrder.map((id) => (
              <Animated.Text
                key={id}
                style={[
                  styles.singleFlag,
                  { fontSize: FLAG_FONT_SIZE },
                  flagStyles[id],
                ]}
              >
                {presets[id].flag}
              </Animated.Text>
            ))}
          </View>

          <View style={styles.inputWrapper}>
            <Animated.View style={activeLayerStyle}>
              {renderTextInput(activePreset)}
            </Animated.View>
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 4,
                  left: 16,
                  right: 16,
                  bottom: 4,
                  zIndex: 2,
                },
                pendingLayerStyle,
              ]}
              pointerEvents="none"
            >
              {renderTextInput(pendingPreset)}
            </Animated.View>
          </View>
          <Pressable style={styles.content} onPress={Keyboard.dismiss} />
          {fabOpen && (
            <Pressable
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: activePreset.paperTheme.backdrop },
              ]}
              onPress={() => setFabOpen(false)}
            />
          )}
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
  flagContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  singleFlag: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 4,
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
