import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useVAD, models } from 'react-native-executorch';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import DeviceInfo from 'react-native-device-info';

import ScreenWrapper from '../../components/ScreenWrapper';
import { ModelStatus } from '../../components/ModelStatus';
import { Button } from '../../components/Button';
import { theme } from '../../theme';

const SAMPLE_RATE = 16000;
const isSimulator = DeviceInfo.isEmulatorSync();

function VADContent() {
  const { isReady, downloadProgress, error, stream, streamInsert, streamStop } = useVAD(
    models.vad.FSMN_VAD
  );

  const [isStreaming, setIsStreaming] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const recorder = useRef(new AudioRecorder());
  const logScrollRef = useRef<ScrollView>(null);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetoothHFP', 'defaultToSpeaker'],
    });
    AudioManager.requestRecordingPermissions().then((status) =>
      setHasMicPermission(status === 'Granted')
    );
  }, []);

  const handleStart = async () => {
    if (isStreaming || !isReady) return;

    if (!hasMicPermission) {
      setRunError('Microphone permission denied. Please enable it in Settings.');
      return;
    }

    setRunError(null);
    setLogs([]);
    setIsStreaming(true);
    addLog('Starting VAD stream…');

    recorder.current.onAudioReady(
      { sampleRate: SAMPLE_RATE, bufferLength: 1600, channelCount: 1 },
      ({ buffer }) => streamInsert(buffer.getChannelData(0))
    );

    try {
      await AudioManager.setAudioSessionActivity(true);
      const started = await recorder.current.start();
      if (started.status === 'error') {
        throw new Error(started.message);
      }

      await stream({
        onSpeechBegin: () => {
          setIsSpeaking(true);
          addLog('Speech detected (begin)');
        },
        onSpeechEnd: () => {
          setIsSpeaking(false);
          addLog('Silence detected (end)');
        },
        options: { timeout: 100, detectionMargin: 300 },
      });
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e));
      setIsStreaming(false);
    }
  };

  const handleStop = async () => {
    await recorder.current.stop();
    streamStop();
    setIsStreaming(false);
    setIsSpeaking(false);
    addLog('VAD stream stopped');
  };

  const streamDisabled = isSimulator || !isReady;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Voice Activity Detection</Text>
        <Text style={styles.cardDescription}>
          Streams microphone audio through the FSMN-VAD model and reports when speech begins and
          ends in real time.
        </Text>
        <ModelStatus
          isReady={isReady}
          downloadProgress={downloadProgress}
          error={error ? error.message : null}
          modelTypeLabel="VAD model"
        />
      </View>

      {runError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{runError}</Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.visualizer}>
          <View style={[styles.indicator, isSpeaking ? styles.speaking : styles.silent]} />
          <Text
            style={[styles.visualizerText, isSpeaking ? styles.speakingText : styles.silentText]}
          >
            {isSpeaking ? 'SPEAKING' : 'SILENT'}
          </Text>
        </View>

        {isStreaming ? (
          <Button title="Stop VAD stream" variant="accent" onPress={handleStop} />
        ) : (
          <Button
            title={isSimulator ? 'Recording not available on simulator' : 'Start VAD stream'}
            onPress={handleStart}
            disabled={streamDisabled}
          />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>VAD events</Text>
        <ScrollView
          ref={logScrollRef}
          style={styles.logScroll}
          onContentSizeChange={() => logScrollRef.current?.scrollToEnd({ animated: true })}
        >
          {logs.length > 0 ? (
            logs.map((log, i) => (
              <Text key={i} style={styles.logText}>
                {log}
              </Text>
            ))
          ) : (
            <Text style={styles.emptyText}>No events logged yet…</Text>
          )}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

export default function VADScreen() {
  return (
    <ScreenWrapper>
      <VADContent />
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
  visualizer: { alignItems: 'center', marginBottom: 20 },
  indicator: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
  },
  speaking: { backgroundColor: '#22c55e' },
  silent: { backgroundColor: '#e9ecef' },
  visualizerText: { fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  speakingText: { color: '#22c55e' },
  silentText: { color: theme.colors.textPlaceholder },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#212529', marginBottom: 10 },
  logScroll: {
    maxHeight: 180,
    backgroundColor: '#f8fafc',
    borderRadius: theme.radius.small,
    borderWidth: 1,
    borderColor: theme.colors.lightBorder,
    padding: 12,
  },
  logText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#334155',
    marginBottom: 2,
  },
  emptyText: { color: theme.colors.textPlaceholder, fontStyle: 'italic' },
  errorContainer: {
    backgroundColor: theme.colors.errorBackground,
    padding: 12,
    borderRadius: theme.radius.small,
    marginBottom: 20,
  },
  errorText: { color: theme.colors.errorText, fontSize: 14, textAlign: 'center' },
});
