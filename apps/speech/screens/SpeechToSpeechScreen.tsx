import React, { useEffect, useRef } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useLLM,
  LFM2_5_1_2B_INSTRUCT_QUANTIZED,
  KOKORO_VOICE_AMERICAN_ENGLISH_FEMALE_HEART,
} from 'react-native-executorch';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import SWMIcon from '../assets/swm_icon.svg';
import DeviceInfo from 'react-native-device-info';
import ErrorBanner from '../components/ErrorBanner';
import { useSpeechToSpeech } from '../hooks/useSpeechToSpeech';

const isSimulator = DeviceInfo.isEmulatorSync();

export const SpeechToSpeechScreen = ({ onBack }: { onBack: () => void }) => {
  // LLM Setup
  const llm = useLLM({
    model: LFM2_5_1_2B_INSTRUCT_QUANTIZED,
  });

  useEffect(() => {
    if (llm.isReady) {
      llm.configure({
        chatConfig: {
          systemPrompt:
            'You are a precise voice assistant. Give very short, concise answers. Avoid long explanations.',
        },
      });
    }
  }, [llm.isReady, llm]);

  const {
    processedText,
    isRecording,
    isTtsPlaying,
    error,
    setError,
    startRecording,
    stopRecording,
    getStatus,
    isReady,
  } = useSpeechToSpeech({
    voice: KOKORO_VOICE_AMERICAN_ENGLISH_FEMALE_HEART,
    onProcessText: async (text) => {
      llm.interrupt();
      return await llm.sendMessage(text);
    },
  });

  const scrollViewRef = useRef<ScrollView>(null);

  const getStatusText = () => {
    if (!llm.isReady)
      return `Loading LLM: ${(100 * llm.downloadProgress).toFixed(2)}%`;
    if (llm.isGenerating) return 'Thinking...';
    return getStatus();
  };

  const recordingButtonDisabled =
    isSimulator || !isReady || !llm.isReady || isTtsPlaying || llm.isGenerating;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <FontAwesome name="chevron-left" size={20} color="#0f186e" />
          </TouchableOpacity>
          <SWMIcon width={60} height={60} />
          <Text style={styles.headerText}>React Native ExecuTorch</Text>
          <Text style={styles.headerText}>Speech to Speech</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text>Status: {getStatusText()}</Text>
        </View>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <View style={styles.transcriptionContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.transcriptionScrollContainer}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          >
            {processedText || llm.response ? (
              <View style={styles.llmResponseContainer}>
                <Text style={styles.llmResponseText}>
                  {processedText || llm.response}
                </Text>
              </View>
            ) : (
              <Text style={styles.placeholderText}>
                {isRecording
                  ? 'Listening...'
                  : 'Press the microphone to start talking.'}
              </Text>
            )}
          </ScrollView>
        </View>

        <View style={styles.controlsContainer}>
          {isRecording ? (
            <TouchableOpacity
              onPress={stopRecording}
              style={[styles.micButton, styles.backgroundRed]}
            >
              <FontAwesome name="microphone-slash" size={32} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              disabled={recordingButtonDisabled}
              onPress={startRecording}
              style={[
                styles.micButton,
                styles.backgroundBlue,
                recordingButtonDisabled && styles.disabled,
              ]}
            >
              <FontAwesome name="microphone" size={32} color="white" />
            </TouchableOpacity>
          )}
          <Text style={styles.helperText}>
            {isSimulator
              ? 'Microphone not available on Simulator'
              : isRecording
                ? 'Tap to stop'
                : 'Tap to speak'}
          </Text>
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
  transcriptionContainer: {
    flex: 1,
    width: '100%',
    marginVertical: 24,
  },
  transcriptionLabel: {
    marginLeft: 12,
    marginBottom: 4,
    color: '#0f186e',
    fontWeight: '600',
  },
  transcriptionScrollContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0f186e',
    padding: 12,
  },
  placeholderText: {
    color: '#aaa',
    fontStyle: 'italic',
  },
  controlsContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backgroundRed: {
    backgroundColor: 'red',
  },
  backgroundBlue: {
    backgroundColor: '#0f186e',
  },
  disabled: {
    opacity: 0.5,
  },
  helperText: {
    marginTop: 12,
    color: '#0f186e',
    fontSize: 16,
    fontWeight: '500',
  },
  llmResponseContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  llmResponseLabel: {
    fontWeight: 'bold',
    color: '#0f186e',
    marginBottom: 4,
  },
  llmResponseText: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 22,
  },
});
