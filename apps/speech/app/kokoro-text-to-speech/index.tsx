import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import {
  useKokoroTextToSpeech,
  models,
  KOKORO_SAMPLE_RATE,
  type KokoroTtsModel,
} from 'react-native-executorch';
import { AudioContext, type AudioBufferQueueSourceNode } from 'react-native-audio-api';

import ScreenWrapper from '../../components/ScreenWrapper';
import { ModelPicker } from '../../components/ModelPicker';
import { ModelStatus } from '../../components/ModelStatus';
import { Button } from '../../components/Button';
import { theme } from '../../theme';

const LANGUAGE_OPTIONS = [
  { label: 'English (US)', value: 'EN_US' as const },
  { label: 'English (GB)', value: 'EN_GB' as const },
  { label: 'Spanish', value: 'ES' as const },
  { label: 'French', value: 'FR' as const },
  { label: 'Italian', value: 'IT' as const },
  { label: 'Portuguese', value: 'PT' as const },
  { label: 'Hindi', value: 'HI' as const },
  { label: 'Polish', value: 'PL' as const },
  { label: 'German', value: 'DE' as const },
];

type KokoroLanguage = (typeof LANGUAGE_OPTIONS)[number]['value'];

// cspell:disable
const SAMPLE_TEXTS: Record<KokoroLanguage, string> = {
  EN_US:
    'Kokoro is a compact text-to-speech model that runs entirely on your device. ' +
    'It converts text into phonemes first, then predicts how long each sound should last, ' +
    'and finally synthesizes the waveform. No internet connection is required.',
  EN_GB:
    'Kokoro is a compact text-to-speech model that runs entirely on your device, ' +
    'converting text into phonemes before synthesising the waveform.',
  ES: 'Kokoro es un modelo de síntesis de voz que funciona completamente en tu dispositivo, sin conexión a internet.',
  FR: 'Kokoro est un modèle de synthèse vocale qui fonctionne entièrement sur votre appareil, sans connexion internet.',
  IT: 'Kokoro è un modello di sintesi vocale che funziona interamente sul tuo dispositivo, senza connessione a internet.',
  PT: 'Kokoro é um modelo de síntese de voz que funciona inteiramente no seu dispositivo, sem ligação à internet.',
  HI: 'कोकोरो एक छोटा टेक्स्ट-टू-स्पीच मॉडल है जो पूरी तरह से आपके डिवाइस पर चलता है।',
  PL: 'Kokoro to niewielki model syntezy mowy, który działa w całości na twoim urządzeniu, bez połączenia z internetem.',
  DE: 'Kokoro ist ein kompaktes Sprachsynthesemodell, das vollständig auf deinem Gerät läuft, ganz ohne Internetverbindung.',
};
// cspell:enable

const SPEED_OPTIONS = [
  { label: '0.8x', value: 0.8 },
  { label: '0.9x', value: 0.9 },
  { label: '1.0x', value: 1.0 },
  { label: '1.1x', value: 1.1 },
  { label: '1.25x', value: 1.25 },
];

function KokoroContent() {
  const [language, setLanguage] = useState<KokoroLanguage>('EN_US');
  const [text, setText] = useState(SAMPLE_TEXTS.EN_US);
  const [speed, setSpeed] = useState(1.0);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chunkProgress, setChunkProgress] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);

  const model = models.textToSpeech.KOKORO[language].XNNPACK_FP32 as KokoroTtsModel<string>;
  const voiceNames = Object.keys(model.voices);
  const [voice, setVoice] = useState(voiceNames[0]!);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const queueSourceRef = useRef<AudioBufferQueueSourceNode | null>(null);

  const { isReady, downloadProgress, error, synthesize, synthesizeStop } =
    useKokoroTextToSpeech(model);

  useEffect(() => {
    setVoice(Object.keys(models.textToSpeech.KOKORO[language].XNNPACK_FP32.voices)[0]!);
    setText(SAMPLE_TEXTS[language]);
  }, [language]);

  const getAudioContext = useCallback(async () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext({ sampleRate: KOKORO_SAMPLE_RATE });
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
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      synthesizeStop?.();
      stopAudioQueue();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [stopAudioQueue, synthesizeStop]);

  const preparePlaybackSource = useCallback(async () => {
    stopAudioQueue();
    const ctx = await getAudioContext();

    const source = ctx.createBufferQueueSource();
    source.connect(ctx.destination);
    source.onBufferEnded = (event) => {
      if (event.isLastBufferInQueue) setIsPlaying(false);
    };
    queueSourceRef.current = source;
    return { ctx, source };
  }, [getAudioContext, stopAudioQueue]);

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

      for await (const chunk of synthesize(text, { voice, speed })) {
        setChunkProgress(
          `Chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks} (${chunk.duration.toFixed(1)}s)`
        );
        durationSum += chunk.duration;

        const buffer = ctx.createBuffer(1, chunk.audio.length, KOKORO_SAMPLE_RATE);
        buffer.copyToChannel(chunk.audio as Float32Array<ArrayBuffer>, 0);
        source.enqueueBuffer(buffer);

        if (!started) {
          started = true;
          setIsPlaying(true);
          source.start(0, 0);
        }
      }

      setTotalDuration(durationSum);
      setChunkProgress(null);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : String(err));
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
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kokoro Text-to-Speech</Text>
        <Text style={styles.cardDescription}>
          Phoneme-driven on-device speech synthesis. Pick a language to load its model, phonemizer
          assets and voices.
        </Text>
        <ModelStatus
          isReady={isReady}
          downloadProgress={downloadProgress}
          error={error ? error.message : null}
          modelTypeLabel="Kokoro TTS models"
        />
      </View>

      {runError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{runError}</Text>
        </View>
      )}

      <View style={styles.card}>
        <ModelPicker
          label="Language"
          options={LANGUAGE_OPTIONS.map((l) => ({ ...l, disabled: isBusy }))}
          selectedValue={language}
          onValueChange={setLanguage}
        />
        <ModelPicker
          label="Voice"
          options={voiceNames.map((name) => ({ label: name, value: name, disabled: isBusy }))}
          selectedValue={voice}
          onValueChange={setVoice}
        />
        <ModelPicker
          label="Speed"
          options={SPEED_OPTIONS.map((s) => ({ ...s, disabled: isBusy }))}
          selectedValue={speed}
          onValueChange={setSpeed}
        />
      </View>

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
              Generated {totalDuration.toFixed(1)}s of audio at {KOKORO_SAMPLE_RATE} Hz
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default function KokoroScreen() {
  return (
    <ScreenWrapper>
      <KokoroContent />
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
