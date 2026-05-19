import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useTextToSpeech,
  TextToSpeechModelConfig,
  KOKORO_AMERICAN_ENGLISH_FEMALE_HEART,
  KOKORO_AMERICAN_ENGLISH_FEMALE_RIVER,
  KOKORO_AMERICAN_ENGLISH_FEMALE_SARAH,
  KOKORO_AMERICAN_ENGLISH_MALE_ADAM,
  KOKORO_AMERICAN_ENGLISH_MALE_MICHAEL,
  KOKORO_AMERICAN_ENGLISH_MALE_SANTA,
  KOKORO_BRITISH_ENGLISH_FEMALE_EMMA,
  KOKORO_BRITISH_ENGLISH_MALE_DANIEL,
  KOKORO_FRENCH_FEMALE_SIWIS,
  KOKORO_SPANISH_FEMALE_DORA,
  KOKORO_SPANISH_MALE_ALEX,
  KOKORO_ITALIAN_FEMALE_SARA,
  KOKORO_ITALIAN_MALE_NICOLA,
  KOKORO_PORTUGUESE_FEMALE_DORA,
  KOKORO_PORTUGUESE_MALE_SANTA,
  KOKORO_GERMAN_FEMALE_ANNA,
  KOKORO_POLISH_MALE_MATEUSZ,
  KOKORO_HINDI_FEMALE_ALPHA,
  KOKORO_HINDI_MALE_OMEGA,
  KOKORO_HINDI_MALE_PSI,
} from 'react-native-executorch';
import { ModelPicker, ModelOption } from '../components/ModelPicker';

type TestPreset = {
  label: string;
  text: string;
  speed: string;
  phonemize: boolean;
};

const TEST_PRESETS: TestPreset[] = [
  { label: 'baseline', text: 'Hello world', speed: '0.9', phonemize: true },
  // empty-after-strip / single-codepoint family
  { label: 'space', text: ' ', speed: '0.9', phonemize: true },
  { label: 'spaces', text: '   ', speed: '0.9', phonemize: true },
  { label: 'newline', text: '\n', speed: '0.9', phonemize: true },
  { label: 'dot', text: '.', speed: '0.9', phonemize: true },
  { label: 'excl', text: '!', speed: '0.9', phonemize: true },
  { label: 'q', text: '?', speed: '0.9', phonemize: true },
  { label: '...', text: '...', speed: '0.9', phonemize: true },
  // script mismatch (English voice) — Bartek-style
  { label: 'Hindi', text: 'शुभ प्रभात', speed: '0.9', phonemize: true },
  { label: 'Arabic', text: 'مرحبا', speed: '0.9', phonemize: true },
  { label: 'Chinese', text: '你好世界', speed: '0.9', phonemize: true },
  { label: 'Japanese', text: 'こんにちは', speed: '0.9', phonemize: true },
  { label: 'Hebrew', text: 'שלום', speed: '0.9', phonemize: true },
  { label: 'Russian', text: 'Привет мир', speed: '0.9', phonemize: true },
  { label: 'Korean', text: '안녕하세요', speed: '0.9', phonemize: true },
  // emoji / zero-width / control
  { label: 'emoji', text: '😀😀😀', speed: '0.9', phonemize: true },
  { label: 'emoji-mix', text: 'Hello 👋🌍', speed: '0.9', phonemize: true },
  { label: 'ZW-chars', text: '‍​﻿', speed: '0.9', phonemize: true },
  {
    label: 'NUL',
    text: 'hello' + String.fromCharCode(0) + 'world',
    speed: '0.9',
    phonemize: true,
  },
  // mixed script
  { label: 'EN+Hindi', text: 'Hello शुभ', speed: '0.9', phonemize: true },
  {
    label: 'diacritics',
    text: 'Café résumé naïve',
    speed: '0.9',
    phonemize: true,
  },
  // speed extremes
  { label: 'speed=0', text: 'Hello world', speed: '0', phonemize: true },
  { label: 'speed=NaN', text: 'Hello world', speed: 'NaN', phonemize: true },
  {
    label: 'speed=Inf',
    text: 'Hello world',
    speed: 'Infinity',
    phonemize: true,
  },
  { label: 'speed=-1', text: 'Hello world', speed: '-1', phonemize: true },
  { label: 'speed=1e-6', text: 'Hello world', speed: '1e-6', phonemize: true },
  { label: 'speed=1e9', text: 'Hello world', speed: '1e9', phonemize: true },
  // phonemize off — bypass vocab
  { label: 'noPh:EN', text: 'hello world', speed: '0.9', phonemize: false },
  { label: 'noPh:nums', text: '1234567890', speed: '0.9', phonemize: false },
  { label: 'noPh:syms', text: '∫∂x √2 ∞', speed: '0.9', phonemize: false },
];

const VOICES: ModelOption<TextToSpeechModelConfig>[] = [
  { label: '🇺🇸 AF Heart', value: KOKORO_AMERICAN_ENGLISH_FEMALE_HEART },
  { label: '🇺🇸 AF River', value: KOKORO_AMERICAN_ENGLISH_FEMALE_RIVER },
  { label: '🇺🇸 AF Sarah', value: KOKORO_AMERICAN_ENGLISH_FEMALE_SARAH },
  { label: '🇺🇸 AM Adam', value: KOKORO_AMERICAN_ENGLISH_MALE_ADAM },
  { label: '🇺🇸 AM Michael', value: KOKORO_AMERICAN_ENGLISH_MALE_MICHAEL },
  { label: '🇺🇸 AM Santa', value: KOKORO_AMERICAN_ENGLISH_MALE_SANTA },
  { label: '🇬🇧 BF Emma', value: KOKORO_BRITISH_ENGLISH_FEMALE_EMMA },
  { label: '🇬🇧 BM Daniel', value: KOKORO_BRITISH_ENGLISH_MALE_DANIEL },
  { label: '🇫🇷 FF Siwis', value: KOKORO_FRENCH_FEMALE_SIWIS },
  { label: '🇪🇸 EF Dora', value: KOKORO_SPANISH_FEMALE_DORA },
  { label: '🇪🇸 EM Alex', value: KOKORO_SPANISH_MALE_ALEX },
  { label: '🇮🇹 IF Sara', value: KOKORO_ITALIAN_FEMALE_SARA },
  { label: '🇮🇹 IM Nicola', value: KOKORO_ITALIAN_MALE_NICOLA },
  { label: '🇵🇹 PF Dora', value: KOKORO_PORTUGUESE_FEMALE_DORA },
  { label: '🇵🇹 PM Santa', value: KOKORO_PORTUGUESE_MALE_SANTA },
  { label: '🇩🇪 DF Anna', value: KOKORO_GERMAN_FEMALE_ANNA },
  { label: '🇵🇱 PM Mateusz', value: KOKORO_POLISH_MALE_MATEUSZ },
  { label: '🇮🇳 HF Alpha', value: KOKORO_HINDI_FEMALE_ALPHA },
  { label: '🇮🇳 HM Omega', value: KOKORO_HINDI_MALE_OMEGA },
  { label: '🇮🇳 HM Psi', value: KOKORO_HINDI_MALE_PSI },
];

import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  AudioManager,
  AudioContext,
  AudioBuffer,
  AudioBufferSourceNode,
} from 'react-native-audio-api';
import SWMIcon from '../assets/swm_icon.svg';
import ErrorBanner from '../components/ErrorBanner';

/**
 * Converts an audio vector (Float32Array) to an AudioBuffer for playback
 * @param audioVector - The generated audio samples from the model
 * @param audioContext - An optional AudioContext to create the buffer in. If not provided, a new one will be created.
 * @param sampleRate - The sample rate (default: 24000 Hz for Kokoro)
 * @returns AudioBuffer ready for playback
 */
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
  const channelData = audioBuffer.getChannelData(0);
  channelData.set(audioVector);

  return audioBuffer;
};

export const TextToSpeechScreen = ({ onBack }: { onBack: () => void }) => {
  const [selectedSpeaker, setSelectedSpeaker] =
    useState<TextToSpeechModelConfig>(KOKORO_AMERICAN_ENGLISH_FEMALE_HEART);

  const model = useTextToSpeech(selectedSpeaker);

  const [inputText, setInputText] = useState('');
  const [speedText, setSpeedText] = useState('0.9');
  const [phonemize, setPhonemize] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<any>(null);
  const sourceRef = useRef<AudioBufferSourceNode>(null);

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['defaultToSpeaker'],
    });

    const context = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = context;
    context.suspend();

    // Increase the audio volume
    const gainNode = context.createGain();
    gainNode.gain.value = 2.0; // Increase volume by 2x
    gainNode.connect(context.destination);
    gainNodeRef.current = gainNode;

    return () => {
      audioContextRef.current?.close();
      audioContextRef.current = null;
      gainNodeRef.current = null;
    };
  }, []);

  useEffect(() => {
    setReadyToGenerate(!model.isGenerating && model.isReady && !isPlaying);
  }, [model.isGenerating, model.isReady, isPlaying]);

  const handlePlayAudio = async () => {
    setIsPlaying(true);
    console.log(
      `[TTS-test] text=${JSON.stringify(inputText)} speed=${speedText} phonemize=${phonemize}`
    );

    try {
      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Bypass the hook's stream() wrapper (which silently appends `.`) — use
      // forward() so we exercise the synthesizer with exactly the input text.
      const audioVec = await model.forward({
        text: inputText,
        speed: parseFloat(speedText),
        phonemize,
      });
      console.log(`[TTS-test] forward() returned ${audioVec.length} samples`);

      if (audioVec.length > 0) {
        await new Promise<void>((resolve) => {
          const audioBuffer = createAudioBufferFromVector(
            audioVec,
            audioContext,
            24000
          );
          const source = (sourceRef.current =
            audioContext.createBufferSource());
          source.buffer = audioBuffer;
          if (gainNodeRef.current) source.connect(gainNodeRef.current);
          else source.connect(audioContext.destination);
          source.onEnded = () => resolve();
          source.start();
        });
      }

      setIsPlaying(false);
      await audioContext.suspend();
    } catch (e) {
      console.log(
        `[TTS-test] threw: ${e instanceof Error ? e.message : String(e)}`
      );
      setError(e instanceof Error ? e.message : String(e));
      setIsPlaying(false);
    }
  };

  // Runs streaming-only test scenarios that the regular Generate button can't
  // exercise (no-terminator stream-flush, ZW-only buffer, insert flood, race
  // with streamStop). Bypasses the hook's `stream()` wrapper by calling
  // `streamInsert` directly and passing `text: ''` to skip the period-append.
  const runStreamTest = async (
    label: string,
    fn: (onNext: (a: Float32Array) => Promise<void>) => Promise<void>
  ) => {
    console.log(`[TTS-stream] start: ${label}`);
    setIsPlaying(true);
    const start = Date.now();
    let chunks = 0;
    let totalSamples = 0;
    const onNext = async (audio: Float32Array) => {
      chunks++;
      totalSamples += audio.length;
      console.log(
        `[TTS-stream] ${label} chunk #${chunks}: ${audio.length} samples (t=${Date.now() - start}ms)`
      );
    };
    try {
      await fn(onNext);
      console.log(
        `[TTS-stream] end: ${label} — ${chunks} chunks, ${totalSamples} samples, ${Date.now() - start}ms`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`[TTS-stream] threw: ${label} -> ${msg}`);
      setError(msg);
    } finally {
      setIsPlaying(false);
    }
  };

  const streamTests: { label: string; run: () => Promise<void> }[] = [
    {
      // Canonical hang repro: one non-terminated character → buffer never drains.
      // Uses streamStop(true) so the test itself can exit (false would hang).
      label: 'no-term:a',
      run: () =>
        runStreamTest('no-term:a', async (onNext) => {
          model.streamInsert('a');
          const p = model.stream({
            text: '',
            speed: 0.9,
            phonemize: true,
            onNext,
            stopAutomatically: true,
          });
          await new Promise((r) => setTimeout(r, 4000));
          model.streamStop(true);
          await p;
        }),
    },
    {
      // Same hang, but with a buffer that would exceed kMaxTextSize once
      // partitioned. Probes whether any upper-bound check exists.
      label: 'no-term:long',
      run: () =>
        runStreamTest('no-term:long', async (onNext) => {
          model.streamInsert(
            'long sentence without any terminator that just keeps going on '.repeat(
              30
            )
          );
          const p = model.stream({
            text: '',
            speed: 0.9,
            phonemize: true,
            onNext,
            stopAutomatically: true,
          });
          await new Promise((r) => setTimeout(r, 4000));
          model.streamStop(true);
          await p;
        }),
    },
    {
      // Multi-segment partition: one insert with several EOS-terminated
      // sentences. Should produce multiple audio chunks via onNext.
      label: 'many-EOS',
      run: () =>
        runStreamTest('many-EOS', async (onNext) => {
          model.streamInsert('apple. banana. cherry. date. elderberry.');
          const p = model.stream({
            text: '',
            speed: 0.9,
            phonemize: true,
            onNext,
            stopAutomatically: true,
          });
          await new Promise((r) => setTimeout(r, 12000));
          model.streamStop(false);
          await p;
        }),
    },
    {
      // Buffer growth + lock contention. Each insert is EOS-terminated so the
      // partitioner can drain; we just shove faster than it can synthesize.
      label: 'insert-flood-EOS',
      run: () =>
        runStreamTest('insert-flood-EOS', async (onNext) => {
          const p = model.stream({
            text: '',
            speed: 0.9,
            phonemize: true,
            onNext,
            stopAutomatically: true,
          });
          for (let i = 0; i < 200; i++) {
            model.streamInsert('hi. ');
          }
          await new Promise((r) => setTimeout(r, 15000));
          model.streamStop(false);
          await p;
        }),
    },
    {
      // Race A: streamStop(true) lands while the synthesizer is in the middle
      // of a chunk. Probes whether the current chunk completes safely.
      label: 'race:stop-during-synth',
      run: () =>
        runStreamTest('race:stop-during-synth', async (onNext) => {
          model.streamInsert('hello world. how are you doing today. ');
          const p = model.stream({
            text: '',
            speed: 0.9,
            phonemize: true,
            onNext,
            stopAutomatically: true,
          });
          // Hit stop while the first chunk is mid-synthesis (~few hundred ms).
          await new Promise((r) => setTimeout(r, 100));
          model.streamStop(true);
          await p;
        }),
    },
    {
      // Race B: streamInsert while the synthesizer is mid-chunk. Probes the
      // mutex window between the worker thread reading the buffer and JS
      // appending to it.
      label: 'race:insert-during-synth',
      run: () =>
        runStreamTest('race:insert-during-synth', async (onNext) => {
          model.streamInsert('hello world. ');
          const p = model.stream({
            text: '',
            speed: 0.9,
            phonemize: true,
            onNext,
            stopAutomatically: true,
          });
          await new Promise((r) => setTimeout(r, 100));
          model.streamInsert('foo bar baz. quick brown fox. ');
          await new Promise((r) => setTimeout(r, 10000));
          model.streamStop(false);
          await p;
        }),
    },
  ];

  const getModelStatus = () => {
    if (model.isGenerating) return 'Generating audio...';
    if (model.isReady) return 'Ready to synthesize';
    return `Loading model: ${(100 * model.downloadProgress).toFixed(2)}%`;
  };

  useEffect(() => {
    if (model.error) setError(String(model.error));
  }, [model.error]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <FontAwesome name="chevron-left" size={20} color="#0f186e" />
            </TouchableOpacity>
            <SWMIcon width={60} height={60} />
            <Text style={styles.headerText}>React Native ExecuTorch</Text>
            <Text style={styles.headerText}>Text to Speech</Text>
          </View>

          <View style={styles.statusContainer}>
            <Text>Status: {getModelStatus()}</Text>
          </View>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          <ModelPicker
            label="Voice"
            models={VOICES}
            selectedModel={selectedSpeaker}
            disabled={model.isGenerating}
            onSelect={(m) => setSelectedSpeaker(m)}
          />

          <View style={styles.presetsContainer}>
            <Text style={styles.inputLabel}>Test presets</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsRow}
            >
              {TEST_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.label}
                  style={styles.presetChip}
                  onPress={() => {
                    setInputText(p.text);
                    setSpeedText(p.speed);
                    setPhonemize(p.phonemize);
                  }}
                >
                  <Text style={styles.presetChipText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Enter text to synthesize</Text>
            <TextInput
              placeholder="Type something..."
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.knobsRow}>
            <View style={styles.knobField}>
              <Text style={styles.inputLabel}>Speed</Text>
              <TextInput
                style={styles.knobInput}
                value={speedText}
                onChangeText={setSpeedText}
                placeholder="0.9"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity
              style={[styles.phonemizeToggle, phonemize && styles.phonemizeOn]}
              onPress={() => setPhonemize((p) => !p)}
            >
              <Text style={styles.phonemizeText}>
                phonemize: {phonemize ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.presetsContainer}>
            <Text style={styles.inputLabel}>Streaming tests</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsRow}
            >
              {streamTests.map((t) => (
                <TouchableOpacity
                  key={t.label}
                  style={styles.presetChip}
                  disabled={!readyToGenerate}
                  onPress={() => {
                    t.run();
                  }}
                >
                  <Text style={styles.presetChipText}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              disabled={!readyToGenerate}
              onPress={handlePlayAudio}
              style={[styles.playButton, !readyToGenerate && styles.disabled]}
            >
              <FontAwesome
                name={isPlaying ? 'volume-up' : 'play'}
                size={20}
                color="white"
              />
              <Text style={styles.buttonText}>
                {isPlaying ? 'Playing...' : 'Generate & Play'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                console.log('[TTS-stream] manual force-stop');
                model.streamStop(true);
                setIsPlaying(false);
              }}
              style={styles.stopButton}
            >
              <FontAwesome name="stop" size={20} color="white" />
              <Text style={styles.buttonText}>Force stop</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 10,
    padding: 10,
    zIndex: 1,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f186e',
  },
  statusContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  inputContainer: {
    width: '100%',
    marginTop: 24,
  },
  inputLabel: {
    marginLeft: 12,
    marginBottom: 4,
    color: '#0f186e',
    fontWeight: '600',
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0f186e',
    padding: 12,
    minHeight: 120,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 24,
  },
  playButton: {
    backgroundColor: '#0f186e',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    letterSpacing: -0.5,
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  knobsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  knobField: {
    flex: 1,
  },
  knobInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0f186e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  phonemizeToggle: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0f186e',
    backgroundColor: 'white',
  },
  phonemizeOn: {
    backgroundColor: '#0f186e',
  },
  phonemizeText: {
    color: '#0f186e',
    fontWeight: '600',
  },
  presetsContainer: {
    width: '100%',
    marginTop: 16,
  },
  presetsRow: {
    paddingHorizontal: 4,
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#0f186e',
    backgroundColor: 'white',
  },
  presetChipText: {
    color: '#0f186e',
    fontWeight: '600',
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  stopButton: {
    backgroundColor: '#b00020',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
});
