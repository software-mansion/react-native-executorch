import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useSpeechToText,
  WHISPER_TINY_EN,
  TranscriptionResult,
} from 'react-native-executorch';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  AudioManager,
  AudioRecorder,
  AudioContext,
} from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system/legacy';
import SWMIcon from '../assets/swm_icon.svg';
import DeviceInfo from 'react-native-device-info';

import { VerboseTranscription } from '../components/VerboseTranscription';

const isSimulator = DeviceInfo.isEmulatorSync();

export const SpeechToTextScreen = ({ onBack }: { onBack: () => void }) => {
  const model = useSpeechToText({
    model: WHISPER_TINY_EN,
  });

  const [transcription, setTranscription] =
    useState<TranscriptionResult | null>(null);

  const [liveResult, setLiveResult] = useState<{
    fullText: string;
    segments: any[];
  } | null>(null);

  const [enableTimestamps, setEnableTimestamps] = useState(false);
  const [audioURL, setAudioURL] = useState('');

  const isRecordingRef = useRef(false);
  const [liveTranscribing, setLiveTranscribing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [recorder] = useState(() => new AudioRecorder());

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetooth', 'defaultToSpeaker'],
    });
    const checkPerms = async () => {
      const granted = await AudioManager.requestRecordingPermissions();
      if (!granted) console.warn('Microphone permission denied!');
    };
    checkPerms();
  }, []);

  async function getAudioFile(sourceUri: string) {
    const destination = FileSystem.cacheDirectory + 'audio_file.wav';

    if (sourceUri.startsWith('http')) {
      const { uri } = await FileSystem.downloadAsync(sourceUri, destination);
      return uri;
    } else {
      await FileSystem.copyAsync({
        from: sourceUri,
        to: destination,
      });
      return destination;
    }
  }

  const handleTranscribeFromURL = async () => {
    if (!audioURL.trim()) {
      console.warn('Please provide a valid audio file URL');
      return;
    }

    const uri = await getAudioFile(audioURL);
    // Reset previous states
    setTranscription(null);
    setLiveResult(null);

    const audioContext = new AudioContext({ sampleRate: 16000 });

    try {
      const decodedAudioData = await audioContext.decodeAudioData(uri);
      const audioBuffer = decodedAudioData.getChannelData(0);
      const result = await model.transcribe(audioBuffer, {
        verbose: enableTimestamps,
      });
      setTranscription(result);
    } catch (error) {
      console.error('Error decoding audio data', error);
      return;
    }
  };

  const handleStartTranscribeFromMicrophone = async () => {
    isRecordingRef.current = true;
    setLiveTranscribing(true);

    setTranscription(null);
    setLiveResult({ fullText: '', segments: [] });

    const sampleRate = 16000;

    recorder.onAudioReady(
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
      await recorder.start();
    } catch (e) {
      console.error('Failed to start recorder', e);
      isRecordingRef.current = false;
      setLiveTranscribing(false);
      return;
    }

    let accumulatedText = '';
    let accumulatedSegments: any[] = [];

    try {
      const streamIter = model.stream({
        verbose: enableTimestamps,
      });

      for await (const { committed, nonCommitted } of streamIter) {
        if (!isRecordingRef.current) break;

        if (committed.text) {
          accumulatedText += committed.text;
        }
        if (committed.segments) {
          accumulatedSegments = [...accumulatedSegments, ...committed.segments];
        }

        const currentDisplay = {
          fullText: accumulatedText + nonCommitted.text,
          segments: [...accumulatedSegments, ...(nonCommitted.segments || [])],
        };

        setLiveResult(currentDisplay);
      }
    } catch (error) {
      console.error('Error during live transcription:', error);
    } finally {
      setLiveTranscribing(false);
    }
  };

  const handleStopTranscribeFromMicrophone = () => {
    isRecordingRef.current = false;

    recorder.stop();
    model.streamStop();
    console.log('Live transcription stopped');
    setLiveTranscribing(false);

    if (liveResult) {
      setTranscription({
        text: liveResult.fullText,
        segments: liveResult.segments,
        language: 'en',
        duration: 0,
      });
      setLiveResult(null);
    }
  };

  const getModelStatus = () => {
    if (model.error) return `${model.error}`;
    if (model.isGenerating) return 'Transcribing...';
    if (model.isReady) return 'Ready to transcribe';
    return `Loading model: ${(100 * model.downloadProgress).toFixed(2)}%`;
  };

  const readyToTranscribe = !model.isGenerating && model.isReady;
  const recordingButtonDisabled = isSimulator || !readyToTranscribe;

  const getDisplayData = (): TranscriptionResult | null => {
    if (liveTranscribing && liveResult) {
      return {
        text: liveResult.fullText,
        segments: liveResult.segments,
        language: 'en',
        duration: 0,
      };
    }
    return transcription;
  };

  const displayData = getDisplayData();

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
            <Text style={styles.headerText}>Speech to Text</Text>
          </View>

          <View style={styles.statusContainer}>
            <Text>Status: {getModelStatus()}</Text>
          </View>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Enable Timestamps (Verbose)</Text>
            <Switch
              value={enableTimestamps}
              onValueChange={(val) => {
                setEnableTimestamps(val);
                setTranscription(null);
                setLiveResult(null);
              }}
              trackColor={{ false: '#767577', true: '#0f186e' }}
              thumbColor={enableTimestamps ? '#fff' : '#f4f3f4'}
              disabled={model.isGenerating}
            />
          </View>

          <View style={styles.transcriptionContainer}>
            <Text style={styles.transcriptionLabel}>Transcription</Text>
            <ScrollView
              ref={scrollViewRef}
              style={styles.transcriptionScrollContainer}
              onContentSizeChange={() =>
                scrollViewRef.current?.scrollToEnd({ animated: true })
              }
            >
              {displayData ? (
                <VerboseTranscription data={displayData} />
              ) : (
                <Text style={styles.placeholderText}>
                  {liveTranscribing
                    ? 'Listening...'
                    : 'No transcription yet...'}
                </Text>
              )}
            </ScrollView>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.urlTranscriptionContainer}>
              <TextInput
                placeholder="Audio file URL to transcribe"
                style={styles.urlTranscriptionInput}
                value={audioURL}
                onChangeText={setAudioURL}
              />
              <TouchableOpacity
                disabled={!readyToTranscribe}
                onPress={handleTranscribeFromURL}
                style={[
                  styles.urlTranscriptionButton,
                  !readyToTranscribe && styles.disabled,
                ]}
              >
                <Text style={styles.buttonText}>Start</Text>
              </TouchableOpacity>
            </View>

            {liveTranscribing ? (
              <TouchableOpacity
                onPress={handleStopTranscribeFromMicrophone}
                style={[styles.liveTranscriptionButton, styles.backgroundRed]}
              >
                <FontAwesome name="microphone-slash" size={22} color="white" />
                <Text style={styles.buttonText}> Stop Live Transcription</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                disabled={recordingButtonDisabled}
                onPress={handleStartTranscribeFromMicrophone}
                style={[
                  styles.liveTranscriptionButton,
                  styles.backgroundBlue,
                  recordingButtonDisabled && styles.disabled,
                ]}
              >
                <FontAwesome name="microphone" size={20} color="white" />
                <Text style={styles.buttonText}>
                  {isSimulator
                    ? 'Recording is not available on Simulator'
                    : 'Start Live Transcription'}
                </Text>
              </TouchableOpacity>
            )}
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
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  toggleLabel: {
    fontSize: 16,
    marginRight: 10,
    color: '#0f186e',
  },
  transcriptionContainer: {
    flex: 1,
    width: '100%',
    marginVertical: 12,
  },
  transcriptionLabel: {
    marginLeft: 12,
    marginBottom: 4,
    color: '#0f186e',
  },
  transcriptionScrollContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0f186e',
    padding: 12,
    maxHeight: 400,
  },
  placeholderText: {
    color: '#aaa',
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 12,
  },
  urlTranscriptionContainer: {
    width: '100%',
    flexDirection: 'row',
  },
  urlTranscriptionInput: {
    flex: 1,
    padding: 12,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: 1,
    borderColor: '#0f186e',
    borderRightWidth: 0,
  },
  urlTranscriptionButton: {
    backgroundColor: '#0f186e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    letterSpacing: -0.5,
    fontSize: 16,
  },
  liveTranscriptionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
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
});
