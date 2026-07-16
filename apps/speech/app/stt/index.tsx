import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {
  useSpeechToText,
  useVoiceActivityDetection,
  models,
  WHISPER_SAMPLE_RATE_HZ,
  type WhisperLanguage,
  type WhisperSttModel,
} from 'react-native-executorch';
import { AudioContext, AudioManager, AudioRecorder } from 'react-native-audio-api';
import RNFS from 'react-native-fs';
import DeviceInfo from 'react-native-device-info';

import ScreenWrapper from '../../components/ScreenWrapper';
import { ModelStatus } from '../../components/ModelStatus';
import { Button } from '../../components/Button';
import { theme } from '../../theme';

const MODELS: { name: string; config: WhisperSttModel }[] = [
  { name: 'Tiny (EN) CPU', config: models.speechToText.WHISPER.EN.TINY.XNNPACK_FP32 },
  { name: 'Tiny CPU', config: models.speechToText.WHISPER.TINY.XNNPACK_FP32 },
  ...(Platform.OS === 'ios'
    ? [
        { name: 'Tiny (EN) CoreML', config: models.speechToText.WHISPER.EN.TINY.COREML_FP16 },
        { name: 'Tiny CoreML', config: models.speechToText.WHISPER.TINY.COREML_FP16 },
      ]
    : []),
];

const SAMPLE_AUDIOS = [
  {
    name: 'English (US)',
    url: 'https://www.voiptroubleshooter.com/open_speech/american/OSR_us_000_0010_8k.wav',
    language: 'en' as WhisperLanguage,
  },
  {
    name: 'English (UK)',
    url: 'https://www.voiptroubleshooter.com/open_speech/british/OSR_uk_000_0020_8k.wav',
    language: 'en' as WhisperLanguage,
  },
  {
    name: 'French',
    url: 'https://www.voiptroubleshooter.com/open_speech/french/OSR_fr_000_0041_8k.wav',
    language: 'fr' as WhisperLanguage,
  },
  {
    name: 'Mandarin (Chinese)',
    url: 'https://www.voiptroubleshooter.com/open_speech/chinese/OSR_cn_000_0072_8k.wav',
    language: 'zh' as WhisperLanguage,
  },
];

const isSimulator = DeviceInfo.isEmulatorSync();

function STTContent() {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]!);
  const [useVadGating, setUseVadGating] = useState(false);
  const [activeTab, setActiveTab] = useState<'file' | 'mic'>('file');

  // Whisper STT Hook
  const {
    isReady: isSttReady,
    downloadProgress: sttProgress,
    error: sttError,
    transcribe,
    stream,
    streamInsert,
    streamStop,
  } = useSpeechToText(selectedModel.config);

  // VAD Hook: only download/load VAD if VAD Gating toggle is enabled
  const vad = useVoiceActivityDetection(models.vad.FSMN_VAD, { preventLoad: !useVadGating });

  // UI State
  const [status, setStatus] = useState<string>('Idle');
  const [fileTokens, setFileTokens] = useState<string[]>([]);
  const [committedText, setCommittedText] = useState('');
  const [nonCommittedText, setNonCommittedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDownloadProgress, setAudioDownloadProgress] = useState<number | null>(null);
  const [currentAudioBuffer, setCurrentAudioBuffer] = useState<any>(null);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const activeSourceRef = useRef<any>(null);

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetoothHFP', 'defaultToSpeaker'],
    });
    AudioManager.requestRecordingPermissions().then((permStatus) =>
      setHasMicPermission(permStatus === 'Granted')
    );
  }, []);

  const handleTabChange = (tab: 'file' | 'mic') => {
    if (status.includes('...')) return;
    setActiveTab(tab);
    setFileTokens([]);
    setCommittedText('');
    setNonCommittedText('');
    setStatus('Idle');
    setCurrentAudioBuffer(null);
    setRunError(null);
  };

  const handleTranscribeUrl = async (url: string, language: WhisperLanguage) => {
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch (e) {}
      activeSourceRef.current = null;
      setIsPlaying(false);
    }
    setCurrentAudioBuffer(null);
    setRunError(null);

    if (!isSttReady || !transcribe) return;

    setStatus('Processing...');
    setFileTokens([]);

    const ext = url.split('?')[0]!.split('.').pop()?.toLowerCase() ?? 'wav';
    const localDest = `${RNFS.CachesDirectoryPath}/test_sample.${ext}`;

    try {
      // 1. Download audio file
      setStatus('Downloading audio...');
      setAudioDownloadProgress(0);
      const downloadRes = await RNFS.downloadFile({
        fromUrl: url,
        toFile: localDest,
        progressInterval: 100,
        begin: () => setAudioDownloadProgress(0),
        progress: ({ bytesWritten, contentLength }: any) => {
          if (contentLength > 0) {
            setAudioDownloadProgress(Math.round((bytesWritten / contentLength) * 100));
          }
        },
      }).promise;
      setAudioDownloadProgress(100);

      if (downloadRes.statusCode !== 200) {
        throw new Error(`Download failed with HTTP status ${downloadRes.statusCode}`);
      }

      // 2. Decode Audio
      setAudioDownloadProgress(null);
      setStatus('Decoding audio...');
      const audioContext = new AudioContext({ sampleRate: WHISPER_SAMPLE_RATE_HZ });
      const decodedData = await audioContext.decodeAudioData(localDest);

      setCurrentAudioBuffer(decodedData);
      const waveform = decodedData.getChannelData(0);

      await RNFS.unlink(localDest).catch(() => {});

      // 3. Transcribe
      setStatus('Transcribing...');
      const result = await transcribe(waveform, { language }, (token: string) => {
        setFileTokens((prev) => [...prev, token]);
      });

      setStatus('Done');
      console.log(`Transcribed: "${result}"`);
    } catch (err) {
      setStatus('Error');
      setRunError(err instanceof Error ? err.message : String(err));
      setAudioDownloadProgress(null);
      await RNFS.unlink(localDest).catch(() => {});
    }
  };

  const togglePlayback = () => {
    if (isPlaying && activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch (e) {}
      activeSourceRef.current = null;
      setIsPlaying(false);
      return;
    }
    if (!currentAudioBuffer) return;
    try {
      const audioContext = new AudioContext({ sampleRate: WHISPER_SAMPLE_RATE_HZ });
      const source = audioContext.createBufferSource();
      source.buffer = currentAudioBuffer;
      source.connect(audioContext.destination);
      source.onEnded = () => {
        setIsPlaying(false);
        activeSourceRef.current = null;
      };
      source.start();
      activeSourceRef.current = source;
      setIsPlaying(true);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : String(err));
    }
  };

  const startRecording = async () => {
    if (!isSttReady || !stream || !streamInsert || isRecording) return;

    if (!hasMicPermission) {
      setRunError('Microphone permission denied. Please enable it in Settings.');
      return;
    }

    setRunError(null);
    setCommittedText('');
    setNonCommittedText('');
    setStatus('Streaming...');
    setIsRecording(true);

    // Run Whisper STT Streaming Async Loop
    (async () => {
      try {
        console.log('[App] starting STT stream, useVadGating =', useVadGating);
        const textStream = stream({
          language: 'en',
          vad: useVadGating && vad.detectWorklet ? { detectWorklet: vad.detectWorklet } : undefined,
          vadOptions: { speechThreshold: 0.5 },
        });
        for await (const result of textStream) {
          setCommittedText(result.committed);
          setNonCommittedText(result.nonCommitted);
        }
      } catch (err) {
        console.error(`Streaming error: ${err}`);
        setRunError(err instanceof Error ? err.message : String(err));
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

    try {
      await AudioManager.setAudioSessionActivity(true);
      const result = await recorder.start();
      if (result.status === 'error') {
        throw new Error(result.message);
      }
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e));
      setIsRecording(false);
      recorderRef.current = null;
      if (streamStop) streamStop();
      setStatus('Error');
    }
  };

  const stopRecording = async () => {
    if (recorderRef.current) {
      await recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (streamStop) streamStop();
    setIsRecording(false);
    setStatus('Done');
  };

  useEffect(() => {
    return () => {
      recorderRef.current?.stop().catch(() => {});
      if (activeSourceRef.current) {
        try {
          activeSourceRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const isModelBusy = status.includes('...');
  const isMicDisabled = isSimulator || !isSttReady || (useVadGating && !vad.isReady);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Model Selector */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Whisper Model Selector</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pickerScroll}
        >
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
        </ScrollView>
      </View>

      {/* Model Status Card */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Model Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Whisper STT:</Text>
          <Text style={[styles.statusValue, isSttReady ? styles.ready : styles.pending]}>
            {isSttReady ? 'Ready' : 'Not Loaded'}
          </Text>
        </View>
        <ModelStatus
          isReady={isSttReady}
          downloadProgress={sttProgress}
          error={sttError?.message}
          modelTypeLabel="Whisper Model"
        />

        {/* VAD Gating Toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextContainer}>
            <Text style={styles.toggleLabel}>Enable VAD Gating</Text>
            <Text style={styles.toggleDesc}>
              Use the FSMN-VAD model to suppress transcription of silences and noise
            </Text>
          </View>
          <Switch
            value={useVadGating}
            onValueChange={(val) => {
              if (isModelBusy || isRecording) return;
              setUseVadGating(val);
            }}
            trackColor={{ false: '#d1d1d6', true: theme.colors.accent }}
          />
        </View>

        {useVadGating && (
          <>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>FSMN VAD:</Text>
              <Text style={[styles.statusValue, vad.isReady ? styles.ready : styles.pending]}>
                {vad.isReady ? 'Ready' : 'Not Loaded'}
              </Text>
            </View>
            <ModelStatus
              isReady={vad.isReady}
              downloadProgress={vad.downloadProgress}
              error={vad.error?.message}
              modelTypeLabel="VAD Model"
            />
          </>
        )}
      </View>

      {runError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{runError}</Text>
        </View>
      )}

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'file' && styles.tabActive]}
          onPress={() => handleTabChange('file')}
        >
          <Text style={[styles.tabText, activeTab === 'file' && styles.tabTextActive]}>
            Transcribe File
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mic' && styles.tabActive]}
          onPress={() => handleTabChange('mic')}
        >
          <Text style={[styles.tabText, activeTab === 'mic' && styles.tabTextActive]}>
            Live Microphone
          </Text>
        </TouchableOpacity>
      </View>

      {/* File Tab Content */}
      {activeTab === 'file' && (
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Test Audio Files</Text>
          {SAMPLE_AUDIOS.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.audioSampleButton}
              onPress={() => handleTranscribeUrl(item.url, item.language)}
              disabled={!isSttReady || isModelBusy}
            >
              <View style={styles.sampleDetails}>
                <Text style={styles.sampleTitle}>{item.name}</Text>
                <Text style={styles.sampleSub} numberOfLines={1}>
                  {item.url}
                </Text>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>
          ))}

          {status !== 'Idle' && (
            <View style={styles.runningStatusBox}>
              <Text style={styles.runningStatusText}>Status: {status}</Text>
              {audioDownloadProgress !== null && (
                <View style={styles.downloadProgress}>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[styles.progressBarFill, { width: `${audioDownloadProgress}%` }]}
                    />
                  </View>
                  <Text style={styles.progressBarLabel}>
                    Downloading audio... {audioDownloadProgress}%
                  </Text>
                </View>
              )}
            </View>
          )}

          {currentAudioBuffer && (
            <Button
              title={isPlaying ? 'Stop Audio Input' : 'Play Audio Input'}
              variant={isPlaying ? 'accent' : 'secondary'}
              onPress={togglePlayback}
              style={styles.playbackBtn}
            />
          )}

          <Text style={styles.resultTitle}>Transcription Output:</Text>
          <ScrollView style={styles.outputBox} contentContainerStyle={styles.outputContainer}>
            {fileTokens.length > 0 ? (
              <Text style={styles.outputText}>{fileTokens.join('')}</Text>
            ) : (
              <Text style={styles.placeholderText}>
                {isSttReady
                  ? 'Tap a test file above to transcribe'
                  : 'Wait for the Whisper model to load first...'}
              </Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* Mic Tab Content */}
      {activeTab === 'mic' && (
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Microphone Stream</Text>

          {isRecording ? (
            <Button title="Stop Stream" variant="accent" onPress={stopRecording} />
          ) : (
            <Button
              title={isSimulator ? 'Simulator recording not supported' : 'Start Stream'}
              onPress={startRecording}
              disabled={isMicDisabled}
            />
          )}

          <Text style={styles.resultTitle}>Real-time Streamed Output:</Text>
          <ScrollView style={styles.outputBox} contentContainerStyle={styles.outputContainer}>
            {committedText || nonCommittedText ? (
              <Text style={styles.outputText}>
                {committedText}
                <Text style={styles.nonCommittedText}> {nonCommittedText}</Text>
              </Text>
            ) : (
              <Text style={styles.placeholderText}>
                {isMicDisabled
                  ? 'Verify model status and permission above'
                  : 'Start the stream and speak into the mic...'}
              </Text>
            )}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

export default function SpeechToTextScreen() {
  return (
    <ScreenWrapper>
      <STTContent />
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
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.strongPrimary,
    marginBottom: 14,
  },
  pickerScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
    borderWidth: 1,
    borderColor: theme.colors.lightBorder,
  },
  chipSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3a3a3c',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  ready: { color: '#22c55e' },
  pending: { color: '#868e96' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 10,
    marginBottom: 10,
  },
  toggleTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  toggleDesc: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: theme.radius.medium,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.small,
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: theme.colors.strongPrimary,
  },
  audioSampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sampleDetails: {
    flex: 1,
  },
  sampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  sampleSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
    maxWidth: 260,
  },
  arrowIcon: {
    fontSize: 16,
    color: theme.colors.accent,
    fontWeight: '700',
    marginLeft: 10,
  },
  runningStatusBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: theme.radius.small,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  runningStatusText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  downloadProgress: {
    marginTop: 8,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: theme.colors.accent,
    borderRadius: 3,
  },
  progressBarLabel: {
    fontSize: 11,
    color: theme.colors.accent,
    fontWeight: '600',
    marginTop: 4,
  },
  playbackBtn: {
    marginTop: 15,
    alignSelf: 'stretch',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginTop: 18,
    marginBottom: 8,
  },
  outputBox: {
    minHeight: 120,
    maxHeight: 240,
    backgroundColor: '#f8fafc',
    borderRadius: theme.radius.small,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  outputContainer: {
    padding: 12,
  },
  outputText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  nonCommittedText: {
    color: '#868e96',
  },
  placeholderText: {
    fontSize: 13,
    color: theme.colors.textPlaceholder,
    fontStyle: 'italic',
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
