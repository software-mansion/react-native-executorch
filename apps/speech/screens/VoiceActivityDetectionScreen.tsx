import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useVAD, FSMN_VAD } from 'react-native-executorch';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import SWMIcon from '../assets/swm_icon.svg';
import DeviceInfo from 'react-native-device-info';
import ErrorBanner from '../components/ErrorBanner';

const isSimulator = DeviceInfo.isEmulatorSync();

export const VoiceActivityDetectionScreen = ({
  onBack,
}: {
  onBack: () => void;
}) => {
  const model = useVAD({
    model: FSMN_VAD,
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const recorder = useRef(new AudioRecorder());
  const logScrollRef = useRef<ScrollView>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetoothHFP', 'defaultToSpeaker'],
    });
    const checkPerms = async () => {
      const status = await AudioManager.requestRecordingPermissions();
      setHasMicPermission(status === 'Granted');
    };
    checkPerms();
  }, []);

  const handleStartStreaming = async () => {
    if (isStreaming || model.isGenerating || !model.isReady) {
      return;
    }

    setIsStreaming(true);
    if (!hasMicPermission) {
      setError('Microphone permission denied. Please enable it in Settings.');
      setIsStreaming(false);
      return;
    }

    setLogs([]);
    addLog('Starting VAD stream...');

    const sampleRate = 16000;

    recorder.current.onAudioReady(
      {
        sampleRate,
        bufferLength: 0.1 * sampleRate,
        channelCount: 1,
      },
      ({ buffer }) => {
        model.streamInsert(buffer.getChannelData(0));
      }
    );

    try {
      const success = await AudioManager.setAudioSessionActivity(true);
      if (!success) {
        setError('Cannot start audio session correctly');
      }
      const result = recorder.current.start();
      if (result.status === 'error') {
        setError(`Recording problems: ${result.status}`);
      }

      await model.stream({
        onSpeechBegin: () => {
          setIsSpeaking(true);
          addLog('Speech detected (Begin)');
        },
        onSpeechEnd: () => {
          setIsSpeaking(false);
          addLog('Silence detected (End)');
        },
        options: {
          timeout: 100,
          detectionMargin: 300,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setIsStreaming(false);
    }
  };

  const handleStopStreaming = () => {
    recorder.current.stop();
    model.streamStop();
    setIsStreaming(false);
    setIsSpeaking(false);
    addLog('VAD stream stopped');
  };

  const getModelStatus = () => {
    if (isStreaming || model.isGenerating) return 'Processing...';
    if (model.isReady) return 'Ready';
    return `Loading model: ${(100 * model.downloadProgress).toFixed(2)}%`;
  };

  useEffect(() => {
    if (model.error) setError(String(model.error));
  }, [model.error]);

  const readyToStream = model.isReady;
  const recordingButtonDisabled =
    isSimulator || !readyToStream || model.isGenerating;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <FontAwesome name="chevron-left" size={20} color="#0f186e" />
          </TouchableOpacity>
          <SWMIcon width={60} height={60} />
          <Text style={styles.headerText}>React Native ExecuTorch</Text>
          <Text style={styles.headerText}>Voice Activity Detection</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text>Status: {getModelStatus()}</Text>
        </View>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <View style={styles.visualizerContainer}>
          <FontAwesome
            name="volume-up"
            size={100}
            color={
              isSpeaking ? styles.speakingText.color : styles.silentText.color
            }
          />
          <Text
            style={[
              styles.visualizerText,
              isSpeaking ? styles.speakingText : styles.silentText,
            ]}
          >
            {isSpeaking ? 'SPEAKING' : 'SILENT'}
          </Text>
        </View>

        <View style={styles.logContainer}>
          <Text style={styles.logLabel}>VAD Events</Text>
          <ScrollView
            ref={logScrollRef}
            style={styles.logScrollContainer}
            onContentSizeChange={() =>
              logScrollRef.current?.scrollToEnd({ animated: true })
            }
          >
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <Text key={i} style={styles.logText}>
                  {log}
                </Text>
              ))
            ) : (
              <Text style={styles.placeholderText}>
                No events logged yet...
              </Text>
            )}
          </ScrollView>
        </View>

        <View style={styles.inputContainer}>
          {isStreaming ? (
            <TouchableOpacity
              onPress={handleStopStreaming}
              style={[styles.liveButton, styles.backgroundRed]}
            >
              <FontAwesome name="microphone-slash" size={22} color="white" />
              <Text style={styles.buttonText}> Stop VAD Stream</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              disabled={recordingButtonDisabled}
              onPress={handleStartStreaming}
              style={[
                styles.liveButton,
                styles.backgroundBlue,
                recordingButtonDisabled && styles.disabled,
              ]}
            >
              <FontAwesome name="microphone" size={20} color="white" />
              <Text style={styles.buttonText}>
                {isSimulator
                  ? 'Recording not available on Simulator'
                  : 'Start VAD Stream'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
  visualizerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualizerText: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
  },
  speakingText: {
    color: '#22c55e',
  },
  silentText: {
    color: '#ef4444',
  },
  logContainer: {
    height: 150,
    width: '100%',
    marginVertical: 12,
  },
  logLabel: {
    marginLeft: 12,
    marginBottom: 4,
    color: '#0f186e',
    fontWeight: '600',
  },
  logScrollContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0f186e',
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  logText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#334155',
    marginBottom: 2,
  },
  placeholderText: {
    color: '#aaa',
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 30,
    width: '100%',
  },
  liveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  backgroundRed: {
    backgroundColor: '#ef4444',
  },
  backgroundBlue: {
    backgroundColor: '#0f186e',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
});
