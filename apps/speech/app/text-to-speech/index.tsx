import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import {
  useSupertonicTextToSpeech,
  models,
  SUPERTONIC_SAMPLE_RATE,
  SUPERTONIC_SUPPORTED_LANGUAGES,
  constants,
  type SupertonicLanguage,
} from 'react-native-executorch';
import { AudioContext, type AudioBufferQueueSourceNode } from 'react-native-audio-api';

import ScreenWrapper from '../../components/ScreenWrapper';
import { ModelPicker } from '../../components/ModelPicker';
import { ModelStatus } from '../../components/ModelStatus';
import { Button } from '../../components/Button';
import { theme } from '../../theme';

const SAMPLE_TEXT =
  'The SuperTonic text-to-speech model generates natural sounding speech entirely on-device. ' +
  'It supports over thirty languages and ten distinct voice styles, from deep male voices to bright female ones. ' +
  'Unlike cloud-based solutions, SuperTonic runs completely offline with no internet connection required. ' +
  'The model uses a flow-matching architecture that iteratively denoises random latent representations into coherent speech waveforms. ' +
  'Each voice style is encoded as a compact embedding that captures the unique timbre, pitch, and speaking patterns of the target speaker. ' +
  'This makes it ideal for accessibility applications, voice assistants, and content creation tools that need high-quality speech synthesis without sending data to external servers.';

const VOICE_OPTIONS = constants.SUPERTONIC_DEFAULT_VOICE_NAMES.map((name) => ({
  label: name,
  value: name as constants.SupertonicDefaultVoiceName,
}));

const LANGUAGE_OPTIONS = SUPERTONIC_SUPPORTED_LANGUAGES.map((lang) => ({
  label: lang,
  value: lang,
}));

const SPEED_OPTIONS = [
  { label: '0.7x', value: 0.7 },
  { label: '0.85x', value: 0.85 },
  { label: '1.0x', value: 1.0 },
  { label: '1.05x', value: 1.05 },
  { label: '1.10x', value: 1.1 },
  { label: '1.2x', value: 1.2 },
  { label: '1.5x', value: 1.5 },
  { label: '2.0x', value: 2.0 },
];

const STEPS_OPTIONS = [
  { label: '6', value: 6 },
  { label: '8 (default)', value: 8 },
  { label: '10', value: 10 },
  { label: '12', value: 12 },
];

function TTSContent() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [selectedVoice, setSelectedVoice] = useState<constants.SupertonicDefaultVoiceName>('F1');
  const [selectedLang, setSelectedLang] = useState<SupertonicLanguage>('en');
  const [speed, setSpeed] = useState(1.05);
  const [totalSteps, setTotalSteps] = useState(8);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chunkProgress, setChunkProgress] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const queueSourceRef = useRef<AudioBufferQueueSourceNode | null>(null);
  const isPlayingRef = useRef(false);

  const { isReady, downloadProgress, error, synthesize, synthesizeStop } =
    useSupertonicTextToSpeech(models.textToSpeech.SUPERTONIC);

  const getAudioContext = useCallback(async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext({ sampleRate: SUPERTONIC_SAMPLE_RATE });
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const stopAudioQueue = useCallback(() => {
    if (queueSourceRef.current) {
      queueSourceRef.current.clearBuffers();
      queueSourceRef.current.stop();
      queueSourceRef.current = null;
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      synthesizeStop?.();
      stopAudioQueue();
      audioCtxRef.current?.close().catch(() => {});
    };
  }, [stopAudioQueue, synthesizeStop]);

  const preparePlaybackSource = useCallback(async () => {
    stopAudioQueue();
    const ctx = await getAudioContext();

    const source = ctx.createBufferQueueSource();
    source.connect(ctx.destination);
    source.onBufferEnded = (event) => {
      if (event.isLastBufferInQueue) {
        isPlayingRef.current = false;
        setIsPlaying(false);
      }
    };
    queueSourceRef.current = source;
    return { ctx, source };
  }, [getAudioContext, stopAudioQueue]);

  const enqueueChunk = useCallback(
    (ctx: AudioContext, source: AudioBufferQueueSourceNode, audio: Float32Array) => {
      const buffer = ctx.createBuffer(1, audio.length, SUPERTONIC_SAMPLE_RATE);
      buffer.copyToChannel(audio as Float32Array<ArrayBuffer>, 0);
      source.enqueueBuffer(buffer);
    },
    []
  );

  const handleSynthesize = async () => {
    if (!synthesize || isSynthesizing || !text.trim()) return;

    setRunError(null);
    setChunkProgress(null);
    setTotalDuration(null);
    setIsSynthesizing(true);

    try {
      const { ctx, source } = await preparePlaybackSource();
      let durationSum = 0;
      let started = false;
      let ttfa: number | null = null;
      const t0 = performance.now();

      for await (const chunk of synthesize(text, {
        voiceStyle: selectedVoice,
        speed,
        lang: selectedLang,
        totalSteps,
      })) {
        setChunkProgress(
          `Chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks} (${chunk.duration.toFixed(1)}s)`
        );
        durationSum += chunk.duration;

        enqueueChunk(ctx, source, chunk.audio);

        if (!started) {
          ttfa = (performance.now() - t0) / 1000;
          started = true;
          isPlayingRef.current = true;
          setIsPlaying(true);
          source.start(0, 0);
        }
      }

      const synthMs = performance.now() - t0;
      const rtf = synthMs / 1000 / durationSum;
      console.log(
        `[TTS] TTFA ${ttfa?.toFixed(2)}s, synth ${(synthMs / 1000).toFixed(2)}s, audio ${durationSum.toFixed(2)}s, RTF ${rtf.toFixed(3)}`
      );

      setTotalDuration(durationSum);
      setChunkProgress(null);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setRunError(errMsg);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleStopPlayback = () => {
    synthesizeStop?.();
    stopAudioQueue();
    setIsSynthesizing(false);
  };

  const isBusy = isSynthesizing || isPlaying;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Model Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>SuperTonic Text-to-Speech</Text>
        <Text style={styles.cardDescription}>
          Generate natural-sounding speech on-device using the SuperTonic 3 model. Supports 32
          languages and 10 voice styles.
        </Text>
        <ModelStatus
          isReady={isReady}
          downloadProgress={downloadProgress}
          error={error ? error.message : null}
          modelTypeLabel="SuperTonic TTS models"
        />
      </View>

      {runError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{runError}</Text>
        </View>
      )}

      {/* Voice & Language Picker */}
      <View style={styles.card}>
        <ModelPicker
          label="Voice"
          options={VOICE_OPTIONS.map((v) => ({
            ...v,
            disabled: isBusy,
          }))}
          selectedValue={selectedVoice}
          onValueChange={setSelectedVoice}
        />
        <ModelPicker
          label="Language"
          options={LANGUAGE_OPTIONS.map((l) => ({
            ...l,
            disabled: isBusy,
          }))}
          selectedValue={selectedLang}
          onValueChange={setSelectedLang}
        />
        <ModelPicker
          label="Speed"
          options={SPEED_OPTIONS.map((s) => ({
            label: s.label,
            value: s.value,
            disabled: isBusy,
          }))}
          selectedValue={speed}
          onValueChange={setSpeed}
        />
        <ModelPicker
          label="Denoising Steps"
          options={STEPS_OPTIONS.map((s) => ({
            label: s.label,
            value: s.value,
            disabled: isBusy,
          }))}
          selectedValue={totalSteps}
          onValueChange={setTotalSteps}
        />
      </View>

      {/* Text Input */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Input Text</Text>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="Enter text to synthesize..."
          placeholderTextColor={theme.colors.textPlaceholder}
          multiline
          numberOfLines={4}
          editable={!isBusy}
        />
      </View>

      {/* Synthesis Controls */}
      <View style={styles.card}>
        <View style={styles.buttonRow}>
          {!isPlaying ? (
            <Button
              title={isSynthesizing ? 'Synthesizing...' : 'Synthesize & Play'}
              onPress={handleSynthesize}
              disabled={!isReady || !text.trim() || isBusy}
              loading={isSynthesizing}
            />
          ) : (
            <Button title="Stop Playback" variant="accent" onPress={handleStopPlayback} />
          )}
        </View>

        {chunkProgress && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{chunkProgress}</Text>
          </View>
        )}

        {totalDuration !== null && !isSynthesizing && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>
              Generated {totalDuration.toFixed(1)}s of audio at {SUPERTONIC_SAMPLE_RATE} Hz
            </Text>
          </View>
        )}

        {isPlaying && (
          <View style={styles.playingContainer}>
            <View style={styles.playingIndicator} />
            <Text style={styles.playingText}>Playing audio...</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default function TTSScreen() {
  return (
    <ScreenWrapper>
      <TTSContent />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.large, paddingBottom: 40 },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.large,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.lightBorder,
  },
  cardTitle: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
    color: theme.colors.strongPrimary,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 10,
  },
  textInput: {
    height: 120,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.small,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.background,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.small,
  },
  progressContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#e8f4fd',
    borderRadius: theme.radius.small,
  },
  progressText: {
    fontSize: 13,
    color: '#1a73e8',
    fontWeight: '500',
    textAlign: 'center',
  },
  resultContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#e6f9e6',
    borderRadius: theme.radius.small,
  },
  resultText: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '500',
    textAlign: 'center',
  },
  playingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 10,
  },
  playingIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    marginRight: 8,
  },
  playingText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: theme.colors.errorBackground,
    padding: 12,
    borderRadius: theme.radius.small,
    marginBottom: 20,
  },
  errorText: {
    color: theme.colors.errorText,
    fontSize: 14,
    textAlign: 'center',
  },
});
