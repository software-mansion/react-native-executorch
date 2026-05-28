import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PaperProvider } from 'react-native-paper';
import {
  View,
  Text,
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
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { models, useLLM } from 'react-native-executorch';
import { useTTS } from '../../hooks/useTTS';
import { presets, presetOrder, buildTheme } from '../../assets/presets';
import GradientBackground from '../../components/GradientBackground';
import ThemedTextInput, {
  type ThemedTextInputHandle,
} from '../../components/ThemedTextInput';

// ---------------------------------------------------------------------------
// BACKGROUND VISIBILITY — tweak gradient intensity
// ---------------------------------------------------------------------------
const GRADIENT_INTENSITY = 1.0; // gradient top visibility (0 = flat, 1 = full)
const FLAG_H_MARGIN = 0; // horizontal margin from screen edges (px)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ANIMATION PARAMETERS — control the preset-switching transition animation
// ---------------------------------------------------------------------------
const ANIM_DURATION = 500; // total crossfade duration (ms)
// ---------------------------------------------------------------------------

function alpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function GemmaXKokoroScreen() {
  const [text, setText] = useState('');
  const [activePresetId, setActivePresetId] = useState(presetOrder[0]);
  const [pendingPresetId, setPendingPresetId] = useState<string | null>(null);
  const isAnimating = useRef(false);
  const animProgress = useSharedValue(1);
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

  const { startStream, insertChunk, stopStream, isActive, error, status } =
    useTTS(activePresetId);

  const llm = useLLM({ model: models.llm.gemma4_e2b() });
  const [isLLMGenerating, setIsLLMGenerating] = useState(false);
  const [llmError, setLLMError] = useState<string | null>(null);
  const processedLLMLengthRef = useRef(0);

  useEffect(() => {
    if (llm.error) setLLMError(String(llm.error));
  }, [llm.error]);

  useEffect(() => {
    if (llm.isReady) {
      llm.configure({
        chatConfig: {
          systemPrompt: `You are a helpful voice assistant. Keep responses concise, natural, and under three short sentences for spoken conversation. Respond only in ${activePreset.label}.`,
        },
      });
    }
  }, [activePresetId, llm.isReady, llm.configure, activePreset.label]);

  useEffect(() => {
    if (llm.response && isActive) {
      const prevLen = processedLLMLengthRef.current;
      if (llm.response.length > prevLen) {
        const chunk = llm.response.slice(prevLen);
        insertChunk(chunk);
        processedLLMLengthRef.current = llm.response.length;
      }
    }
  }, [llm.response, isActive, insertChunk]);

  const handleSubmit = useCallback(
    async (inputText: string) => {
      if (!inputText.trim() || llm.isGenerating || isActive) return;
      Keyboard.dismiss();
      setLLMError(null);
      setIsLLMGenerating(true);
      processedLLMLengthRef.current = 0;

      const ttsPromise = startStream();

      try {
        await llm.sendMessage(inputText);
      } catch (_) {
        // errors surfaced via llm.error
      } finally {
        stopStream(false);
        await ttsPromise;
        setIsLLMGenerating(false);
      }
    },
    [llm, startStream, stopStream, isActive]
  );

  const overlayStatus = (() => {
    if (isLLMGenerating && isActive) return 'Generating & Speaking...';
    if (isLLMGenerating) return 'Generating response...';
    return status;
  })();
  const showOverlay = isLLMGenerating || isActive;

  const llmStatus =
    !llm.isReady && !llm.error
      ? `Loading Gemma: ${(llm.downloadProgress * 100).toFixed(0)}%`
      : null;

  const pulseProgress = useSharedValue(0);

  const overlayPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + 0.25 * pulseProgress.value,
  }));

  const indicatorPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + 0.4 * pulseProgress.value,
    transform: [{ scale: 0.95 + 0.05 * pulseProgress.value }],
  }));

  useEffect(() => {
    if (showOverlay) {
      pulseProgress.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseProgress.value = 0;
    }
    return () => {
      pulseProgress.value = 0;
    };
  }, [showOverlay, pulseProgress]);

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

          <ThemedTextInput
            ref={inputRef}
            text={text}
            onChangeText={setText}
            activePreset={activePreset}
            pendingPreset={pendingPreset}
            activeLayerStyle={activeLayerStyle}
            pendingLayerStyle={pendingLayerStyle}
            onSend={handleSubmit}
          />

          {!showOverlay && (llmStatus || llmError || error || status) && (
            <View style={styles.statusRow}>
              {llmError || error ? (
                <Text style={styles.statusError} numberOfLines={2}>
                  {llmError || error}
                </Text>
              ) : (
                <Text style={styles.statusText}>{llmStatus || status}</Text>
              )}
            </View>
          )}

          <View style={styles.languageRow}>
            {presetOrder.map((id) => {
              const preset = presets[id];
              const isActive = id === activePresetId;
              return (
                <Pressable
                  key={id}
                  onPress={() => triggerTransition(id)}
                  style={({ pressed }) => [
                    styles.languageButton,
                    {
                      backgroundColor: isActive
                        ? preset.ui.fabBackground
                        : alpha(preset.ui.fabBackground, 0.12),
                      borderColor: isActive
                        ? preset.ui.fabIcon
                        : alpha(preset.ui.fabIcon, 0.2),
                      borderWidth: isActive ? 2.5 : 1,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.languageFlag,
                      {
                        color: isActive
                          ? preset.ui.fabIcon
                          : alpha(preset.ui.fabIcon, 0.45),
                      },
                    ]}
                  >
                    {preset.flag}
                  </Text>
                  <Text
                    style={[
                      styles.languageLabel,
                      {
                        color: isActive
                          ? preset.ui.fabIcon
                          : alpha(preset.ui.fabIcon, 0.45),
                      },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={styles.content}
            onPress={() => {
              inputRef.current?.blur();
              Keyboard.dismiss();
            }}
          />

          {showOverlay && (
            <Animated.View
              style={[styles.ttsOverlay, overlayPulseStyle]}
              pointerEvents="auto"
            >
              <Animated.View style={[styles.ttsIndicator, indicatorPulseStyle]}>
                <Text style={styles.ttsIndicatorText}>{overlayStatus}</Text>
              </Animated.View>
            </Animated.View>
          )}
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
  languageRow: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 10,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statusRow: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  statusError: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    color: '#EF4444',
  },
  ttsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ttsIndicator: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ttsIndicatorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
