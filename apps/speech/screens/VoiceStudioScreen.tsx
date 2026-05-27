import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import {
  KOKORO_SMALL,
  KOKORO_VOICE_AF_HEART,
  useTextToSpeech,
} from 'react-native-executorch';
import {
  AudioManager,
  AudioContext,
  AudioBuffer,
  AudioBufferSourceNode,
} from 'react-native-audio-api';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import ErrorBanner from '../components/ErrorBanner';

const Palette = {
  bg: '#0B1224',
  text: '#F8FAFF',
  textMuted: 'rgba(248, 250, 255, 0.55)',
  accent: 'rgb(82, 107, 235)',
  hairline: 'rgba(248, 250, 255, 0.08)',
};

const BAR_COUNT = 40;

const createAudioBufferFromVector = (
  audioVector: Float32Array,
  audioContext: AudioContext | null = null,
  sampleRate: number = 24000
): AudioBuffer => {
  if (audioContext == null) audioContext = new AudioContext({ sampleRate });
  const audioBuffer = audioContext.createBuffer(
    1,
    audioVector.length,
    sampleRate
  );
  audioBuffer.getChannelData(0).set(audioVector);
  return audioBuffer;
};

function WaveformBar({
  index,
  total,
  amplitude,
}: {
  index: number;
  total: number;
  amplitude: SharedValue<number>;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const dur = 380 + (index % 7) * 55;
    progress.value = withDelay(
      (index * 30) % 600,
      withRepeat(
        withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const center = (total - 1) / 2;
  const envelope = 1 - Math.pow(Math.abs(index - center) / center, 1.8) * 0.55;

  const animatedStyle = useAnimatedStyle(() => {
    const maxHeight = 140 * envelope * amplitude.value;
    return {
      height: interpolate(progress.value, [0, 1], [6, 6 + maxHeight]),
      opacity: 0.35 + amplitude.value * 0.55,
    };
  });

  return <Animated.View style={[styles.bar, animatedStyle]} />;
}

export const VoiceStudioScreen = ({ onBack }: { onBack: () => void }) => {
  const model = useTextToSpeech({
    model: KOKORO_SMALL,
    voice: KOKORO_VOICE_AF_HEART,
  });

  const [inputText, setInputText] = useState(
    'On-device AI is changing everything. With React Native ExecuTorch, you can run powerful models locally — no cloud, no latency, no compromise.'
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const amplitude = useSharedValue(0);

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playback',
      iosMode: 'spokenAudio',
      iosOptions: ['defaultToSpeaker'],
    });
    audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current.suspend();
    return () => {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (model.error) setError(String(model.error));
  }, [model.error]);

  const active = isPlaying || model.isGenerating;
  useEffect(() => {
    if (!active) {
      amplitude.value = withTiming(0, { duration: 350 });
    }
  }, [active, amplitude]);

  const handlePlay = async () => {
    if (!inputText.trim() || !model.isReady || isPlaying) return;
    setIsPlaying(true);
    const audioContext = audioContextRef.current;
    if (!audioContext) {
      setIsPlaying(false);
      return;
    }
    try {
      if (audioContext.state === 'suspended') await audioContext.resume();

      const onNext = async (audioVec: Float32Array) =>
        new Promise<void>((resolve) => {
          const audioBuffer = createAudioBufferFromVector(
            audioVec,
            audioContext,
            24000
          );
          const source = (sourceRef.current =
            audioContext.createBufferSource());
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.onEnded = () => resolve();
          source.start();

          // Defer envelope computation so audio playback starts immediately —
          // running the RMS loop synchronously before source.start() can
          // stall streaming and make the speech sound choppy.
          setTimeout(() => {
            const windowMs = 60;
            const sampleRate = 24000;
            const windowSize = Math.floor(sampleRate * (windowMs / 1000));
            const steps: number[] = [];
            for (let i = 0; i < audioVec.length; i += windowSize) {
              const end = Math.min(i + windowSize, audioVec.length);
              let sum = 0;
              for (let j = i; j < end; j++) sum += audioVec[j] * audioVec[j];
              const rms = Math.sqrt(sum / Math.max(1, end - i));
              steps.push(Math.min(1, 0.3 + rms * 4));
            }
            if (steps.length > 0) {
              const [first, ...rest] = steps;
              amplitude.value = withSequence(
                withTiming(first, {
                  duration: windowMs,
                  easing: Easing.linear,
                }),
                ...rest.map((v) =>
                  withTiming(v, { duration: windowMs, easing: Easing.linear })
                )
              );
            }
          }, 0);
        });

      const onEnd = async () => {
        if (audioContext.state === 'running') {
          try {
            await audioContext.suspend();
          } catch {}
        }
      };

      await model.stream({ text: inputText, onNext, onEnd });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsPlaying(false);
      amplitude.value = withTiming(0, { duration: 250 });
    }
  };

  const bars = useMemo(
    () => Array.from({ length: BAR_COUNT }, (_, i) => i),
    []
  );

  const playDisabled = !model.isReady || isPlaying || !inputText.trim();
  const buttonLabel = !model.isReady
    ? `Loading ${(model.downloadProgress * 100).toFixed(0)}%`
    : isPlaying
      ? 'Speaking…'
      : model.isGenerating
        ? 'Generating…'
        : 'Generate & Play';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={16}
          >
            <FontAwesome name="chevron-left" size={18} color={Palette.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voice Studio</Text>
          <View style={styles.backBtn} />
        </View>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <View style={styles.waveform}>
          {bars.map((i) => (
            <WaveformBar
              key={i}
              index={i}
              total={BAR_COUNT}
              amplitude={amplitude}
            />
          ))}
        </View>

        <View style={styles.controls}>
          <View style={styles.inputWrap}>
            <TextInput
              multiline
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type or speak something for the model to read…"
              placeholderTextColor={Palette.textMuted}
              style={styles.input}
              editable={!isPlaying && !model.isGenerating}
            />
            <Pressable
              hitSlop={12}
              style={({ pressed }) => [
                styles.micBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <FontAwesome name="microphone" size={18} color={Palette.text} />
            </Pressable>
          </View>

          <Pressable
            onPress={handlePlay}
            disabled={playDisabled}
            style={({ pressed }) => [
              styles.playBtn,
              playDisabled && { opacity: 0.5 },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <FontAwesome
              name={isPlaying ? 'volume-up' : 'play'}
              size={18}
              color={Palette.text}
            />
            <Text style={styles.playBtnText}>{buttonLabel}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  bar: {
    width: 5,
    borderRadius: 3,
    minHeight: 6,
    backgroundColor: Palette.accent,
  },
  controls: {
    paddingHorizontal: 32,
    paddingBottom: 24,
    gap: 16,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Palette.hairline,
    borderRadius: 14,
    paddingLeft: 18,
    paddingRight: 8,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    color: Palette.text,
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '500',
    letterSpacing: 0.2,
    minHeight: 72,
    maxHeight: 120,
    paddingVertical: 12,
    paddingRight: 8,
    textAlignVertical: 'top',
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(82, 107, 235, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(82, 107, 235, 0.45)',
    marginTop: 6,
  },
  playBtn: {
    height: 60,
    borderRadius: 14,
    backgroundColor: Palette.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: Palette.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.35,
  },
  playBtnText: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
