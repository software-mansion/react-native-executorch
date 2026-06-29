import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Keyboard } from 'react-native';
import { commonStyles, theme } from '../../theme';
import { useTextToSpeech, models } from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { ModelPicker, type ModelOption } from '../../components/ModelPicker';
import { ModelStatus } from '../../components/ModelStatus';
import { LatencyIndicator } from '../../components/LatencyIndicator';
import { Button } from '../../components/Button';
import type { TextToSpeechModel } from 'react-native-executorch';
import {
  AudioManager,
  AudioContext,
  AudioBuffer,
  AudioBufferSourceNode,
} from 'react-native-audio-api';

const VOICE_OPTIONS: ModelOption[] = [
  { label: 'AF Heart (en-us)', value: models.textToSpeech.AF_HEART },
  { label: 'AF River (en-us)', value: models.textToSpeech.AF_RIVER },
  { label: 'AF Sarah (en-us)', value: models.textToSpeech.AF_SARAH },
  { label: 'AM Adam (en-us)', value: models.textToSpeech.AM_ADAM },
  { label: 'AM Michael (en-us)', value: models.textToSpeech.AM_MICHAEL },
  { label: 'BF Emma (en-gb)', value: models.textToSpeech.BF_EMMA },
  { label: 'BM Daniel (en-gb)', value: models.textToSpeech.BM_DANIEL },
  { label: 'FF Siwis (fr)', value: models.textToSpeech.FF_SIWIS },
  { label: 'EF Dora (es)', value: models.textToSpeech.EF_DORA },
  { label: 'EM Alex (es)', value: models.textToSpeech.EM_ALEX },
  { label: 'IF Sara (it)', value: models.textToSpeech.IF_SARA },
  { label: 'IM Nicola (it)', value: models.textToSpeech.IM_NICOLA },
  { label: 'PF Dora (pt)', value: models.textToSpeech.PF_DORA },
  { label: 'PM Santa (pt)', value: models.textToSpeech.PM_SANTA },
  { label: 'HF Alpha (hi)', value: models.textToSpeech.HF_ALPHA },
  { label: 'HM Omega (hi)', value: models.textToSpeech.HM_OMEGA },
  { label: 'PM Mateusz (pl)', value: models.textToSpeech.PM_MATEUSZ },
  { label: 'DF Anna (de)', value: models.textToSpeech.DF_ANNA },
];

const createAudioBufferFromVector = (
  audioVector: Float32Array,
  audioContext: AudioContext | null = null,
  sampleRate: number = 24000
): AudioBuffer => {
  if (audioContext == null) audioContext = new AudioContext({ sampleRate });

  const audioBuffer = audioContext.createBuffer(1, audioVector.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  channelData.set(audioVector);

  return audioBuffer;
};

function TextToSpeechContent() {
  const [selectedVoice, setSelectedVoice] = useState<TextToSpeechModel>(VOICE_OPTIONS[0].value);
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { isReady, downloadProgress, error: loadError, stream } = useTextToSpeech(selectedVoice);

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<any>(null);

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['defaultToSpeaker'],
    });

    const context = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = context;
    context.suspend();

    const gainNode = context.createGain();
    gainNode.gain.value = 2.0;
    gainNode.connect(context.destination);
    gainNodeRef.current = gainNode;

    return () => {
      audioContextRef.current?.close();
      audioContextRef.current = null;
      gainNodeRef.current = null;
    };
  }, []);

  const handleSpeak = useCallback(async () => {
    if (!stream || !text.trim()) return;

    Keyboard.dismiss();
    setIsPlaying(true);
    setError(null);
    const start = Date.now();

    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    try {
      await stream({
        text: text.trim(),
        speed: 0.9,
        onBegin: () => {
          setLatency(null);
        },
        // Resolve once this chunk has finished playing so the next one is
        // delivered only afterwards — giving gapless, sequential playback.
        onNext: (audioVec: Float32Array) =>
          new Promise<void>((resolve) => {
            const audioBuffer = createAudioBufferFromVector(audioVec, audioContext, 24000);

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;

            if (gainNodeRef.current) {
              source.connect(gainNodeRef.current);
            } else {
              source.connect(audioContext.destination);
            }

            source.onEnded = () => resolve();
            source.start();
          }),
        onEnd: () => {
          setLatency(Date.now() - start);
          setIsPlaying(false);
          audioContext.suspend();
        },
      });
    } catch (e: any) {
      setError(e.message || String(e));
      setIsPlaying(false);
    }
  }, [stream, text]);

  const activeError = loadError ? String(loadError) : error;

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={commonStyles.contentContainer}
    >
      <Text style={commonStyles.description}>
        Enter text and select a voice to generate speech.
      </Text>

      <ModelPicker
        label="Voice"
        options={VOICE_OPTIONS}
        selectedValue={selectedVoice}
        onValueChange={(model) => {
          setSelectedVoice(model);
          setError(null);
          setLatency(null);
        }}
      />

      <ModelStatus
        isReady={isReady}
        downloadProgress={downloadProgress}
        error={activeError}
        modelTypeLabel="TTS model"
      />

      <TextInput
        style={styles.textInput}
        placeholder="Type something to speak..."
        placeholderTextColor={theme.colors.textPlaceholder}
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <View style={commonStyles.buttonRow}>
        <Button
          title={isPlaying ? 'Speaking...' : 'Speak'}
          onPress={handleSpeak}
          disabled={!isReady || !text.trim() || isPlaying}
          loading={isPlaying}
          variant="primary"
        />
      </View>

      <LatencyIndicator latency={latency} />
    </ScrollView>
  );
}

export default function TextToSpeechScreen() {
  return (
    <ScreenWrapper>
      <TextToSpeechContent />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  textInput: {
    width: '100%',
    minHeight: 100,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.medium,
    borderWidth: 1,
    borderColor: theme.colors.lightBorder,
    padding: theme.spacing.medium,
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.large,
  },
});
