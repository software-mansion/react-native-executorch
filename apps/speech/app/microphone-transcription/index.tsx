import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSpeechToText, models, WHISPER_SAMPLE_RATE_HZ } from 'react-native-executorch';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import DeviceInfo from 'react-native-device-info';

import ScreenWrapper from '../../components/ScreenWrapper';
import { ModelPicker } from '../../components/ModelPicker';
import { ModelStatus } from '../../components/ModelStatus';
import { theme } from '../../theme';

const MODELS = [
  {
    name: 'Tiny English (CPU)',
    config: models.speechToText.WHISPER.EN.TINY.XNNPACK_FP32,
  },
  {
    name: 'Tiny English (CoreML)',
    config: models.speechToText.WHISPER.EN.TINY.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
  {
    name: 'Tiny English (MLX)',
    config: models.speechToText.WHISPER.EN.TINY.MLX_BF16,
    disabled: Platform.OS !== 'ios',
  },
  {
    name: 'Base English (CPU)',
    config: models.speechToText.WHISPER.EN.BASE.XNNPACK_FP32,
  },
  {
    name: 'Base English (CoreML)',
    config: models.speechToText.WHISPER.EN.BASE.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
  {
    name: 'Base English (MLX)',
    config: models.speechToText.WHISPER.EN.BASE.MLX_BF16,
    disabled: Platform.OS !== 'ios',
  },
  {
    name: 'Small English (CPU)',
    config: models.speechToText.WHISPER.EN.SMALL.XNNPACK_FP32,
  },
  {
    name: 'Small English (CoreML)',
    config: models.speechToText.WHISPER.EN.SMALL.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
  {
    name: 'Small English (MLX)',
    config: models.speechToText.WHISPER.EN.SMALL.MLX_INT8,
    disabled: Platform.OS !== 'ios',
  },
  {
    name: 'Tiny Multilingual (CPU)',
    config: models.speechToText.WHISPER.TINY.XNNPACK_FP32,
  },
  {
    name: 'Tiny Multilingual (CoreML)',
    config: models.speechToText.WHISPER.TINY.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
  {
    name: 'Tiny Multilingual (MLX)',
    config: models.speechToText.WHISPER.TINY.MLX_BF16,
    disabled: Platform.OS !== 'ios',
  },
  {
    name: 'Tiny Multilingual (Vulkan fp16)',
    config: models.speechToText.WHISPER.TINY.VULKAN_FP16,
    disabled: Platform.OS !== 'android',
  },
  {
    name: 'Tiny Multilingual (Vulkan int8)',
    config: models.speechToText.WHISPER.TINY.VULKAN_INT8,
    disabled: Platform.OS !== 'android',
  },
  {
    name: 'Base Multilingual (CPU)',
    config: models.speechToText.WHISPER.BASE.XNNPACK_FP32,
  },
  {
    name: 'Base Multilingual (CoreML)',
    config: models.speechToText.WHISPER.BASE.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
  {
    name: 'Base Multilingual (MLX)',
    config: models.speechToText.WHISPER.BASE.MLX_BF16,
    disabled: Platform.OS !== 'ios',
  },
  {
    name: 'Small Multilingual (CPU)',
    config: models.speechToText.WHISPER.SMALL.XNNPACK_FP32,
  },
  {
    name: 'Small Multilingual (CoreML)',
    config: models.speechToText.WHISPER.SMALL.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
  {
    name: 'Small Multilingual (MLX)',
    config: models.speechToText.WHISPER.SMALL.MLX_INT8,
    disabled: Platform.OS !== 'ios',
  },
];

const isSimulator = DeviceInfo.isEmulatorSync();

function STTContent() {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]!);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [status, setStatus] = useState<string>('Idle');
  const [committedText, setCommittedText] = useState('');
  const [nonCommittedText, setNonCommittedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const {
    isReady: isSttReady,
    stream,
    streamInsert,
    streamStop,
    downloadProgress,
    error: modelError,
  } = useSpeechToText(selectedModel.config);

  const supportedLanguages = selectedModel.config.supportedLanguages;

  const recorderRef = useRef<AudioRecorder | null>(null);

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetoothHFP', 'defaultToSpeaker'],
    });
    AudioManager.requestRecordingPermissions();
    return () => {
      recorderRef.current?.stop().catch(() => {});
      if (streamStop) streamStop();
    };
  }, [streamStop]);

  const startRecording = async () => {
    if (!isSttReady || !stream || !streamInsert || isRecording) return;
    setRunError(null);
    setCommittedText('');
    setNonCommittedText('');
    setStatus('Streaming...');
    setIsRecording(true);

    (async () => {
      try {
        const textStream = stream({ language: selectedLanguage as any });
        for await (const result of textStream) {
          setCommittedText(result.committed);
          setNonCommittedText(result.nonCommitted);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setRunError(errMsg);
      }
    })();

    const recorder = new AudioRecorder();
    recorderRef.current = recorder;

    recorder.onAudioReady(
      { sampleRate: WHISPER_SAMPLE_RATE_HZ, bufferLength: 4096, channelCount: 1 },
      (event: any) => {
        const samples = event.buffer.getChannelData(0);
        streamInsert(new Float32Array(samples));
      }
    );

    const result = await recorder.start();
    if (result.status === 'error') {
      setRunError(result.message);
      setIsRecording(false);
      setStatus('Error');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    if (recorderRef.current) {
      await recorderRef.current.stop().catch(() => {});
      recorderRef.current = null;
    }
    if (streamStop) streamStop();
    setIsRecording(false);
    setStatus('Done');
  };

  const isModelBusy = status.includes('...');
  const isMicDisabled = isSimulator || !isSttReady;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <ModelPicker
          label="Whisper Model"
          options={MODELS.map((m) => ({
            label: m.name,
            value: m,
            disabled: isModelBusy || !!m.disabled,
          }))}
          selectedValue={selectedModel}
          onValueChange={(m) => {
            setSelectedModel(m);
            setSelectedLanguage(m.config.supportedLanguages[0]!);
          }}
        />
        <ModelStatus
          isReady={isSttReady}
          downloadProgress={downloadProgress}
          error={modelError ? modelError.message : null}
          modelTypeLabel="Whisper model"
        />
        {supportedLanguages.length > 1 && (
          <ModelPicker
            label="Language"
            options={supportedLanguages.map((lang) => ({
              label: lang,
              value: lang,
              disabled: isModelBusy,
            }))}
            selectedValue={selectedLanguage}
            onValueChange={setSelectedLanguage}
          />
        )}
      </View>

      {runError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{runError}</Text>
        </View>
      )}

      {/* Live Mic Panel */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Live Microphone Gated STT</Text>
        <View style={styles.buttonContainer}>
          {!isRecording ? (
            <TouchableOpacity
              style={[styles.button, isMicDisabled && styles.buttonDisabled]}
              onPress={startRecording}
              disabled={isMicDisabled}
            >
              <Text style={styles.buttonText}>Start Streaming</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.button, styles.buttonStop]} onPress={stopRecording}>
              <Text style={styles.buttonText}>Stop Streaming</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.resultHeader}>Transcription Output:</Text>
        <View style={styles.textOutputContainer}>
          <Text style={styles.committedText}>
            {committedText}
            {nonCommittedText ? (
              <Text style={styles.nonCommittedText}> {nonCommittedText}</Text>
            ) : null}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default function STTScreen() {
  return (
    <ScreenWrapper>
      <STTContent />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16 },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.strongPrimary,
    marginBottom: 12,
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#ffdddd',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: { color: '#cc0000', fontSize: 13 },
  buttonContainer: { alignItems: 'center', marginVertical: 12 },
  button: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonStop: { backgroundColor: '#ff3b30' },
  buttonDisabled: { backgroundColor: '#d1d1d6' },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  resultHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  textOutputContainer: {
    minHeight: 100,
    padding: 12,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  committedText: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20 },
  nonCommittedText: { color: theme.colors.textMuted, fontStyle: 'italic' },
});
