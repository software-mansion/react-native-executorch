import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSpeechToText, models, WHISPER_SAMPLE_RATE_HZ } from 'react-native-executorch';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import DeviceInfo from 'react-native-device-info';

import ScreenWrapper from '../../components/ScreenWrapper';
import { theme } from '../../theme';

const MODELS = [
  {
    name: 'Tiny English (CPU)',
    config: models.speechToText.WHISPER.EN.TINY.XNNPACK_FP32,
  },
  {
    name: 'Tiny English (CoreML)',
    config: models.speechToText.WHISPER.EN.TINY.COREML_FP16,
  },
];

const isSimulator = DeviceInfo.isEmulatorSync();

export default function STTScreen() {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]!);
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
  } = useSpeechToText(selectedModel.config);

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
        const textStream = stream({ language: 'en' });
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
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Model Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Whisper Model</Text>
          <View style={styles.pickerRow}>
            {MODELS.map((item) => {
              const isSelected = item.config === selectedModel.config;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setSelectedModel(item)}
                  disabled={isModelBusy}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
  pickerRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: theme.colors.border,
  },
  chipSelected: { backgroundColor: theme.colors.accent },
  chipText: { color: theme.colors.textSecondary, fontSize: 13 },
  chipTextSelected: { color: '#fff', fontWeight: 'bold' },
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
