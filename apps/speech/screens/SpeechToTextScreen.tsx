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
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useSpeechToText, WHISPER_TINY_EN } from 'react-native-executorch';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  AudioManager,
  AudioRecorder,
  AudioContext,
} from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system/legacy';
import SWMIcon from '../assets/swm_icon.svg';
import DeviceInfo from 'react-native-device-info';

const isSimulator = DeviceInfo.isEmulatorSync();

export const SpeechToTextScreen = () => {
  const model = useSpeechToText({
    model: WHISPER_TINY_EN,
  });

  const [transcription, setTranscription] = useState('');
  const [audioURL, setAudioURL] = useState('');
  const [liveTranscribing, setLiveTranscribing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [recorder] = useState(
    () =>
      new AudioRecorder({
        sampleRate: 16000,
        bufferLengthInSamples: 1600,
      })
  );

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetooth', 'defaultToSpeaker'],
    });
    AudioManager.requestRecordingPermissions();
  }, []);

  const handleTranscribeFromURL = async () => {
    if (!audioURL.trim()) {
      console.warn('Please provide a valid audio file URL');
      return;
    }

    const { uri } = await FileSystem.downloadAsync(
      audioURL,
      FileSystem.cacheDirectory + 'audio_file'
    );

    const audioContext = new AudioContext({ sampleRate: 16000 });

    try {
      const decodedAudioData = await audioContext.decodeAudioDataSource(uri);
      const audioBuffer = decodedAudioData.getChannelData(0);
      setTranscription(await model.transcribe(audioBuffer));
    } catch (error) {
      console.error('Error decoding audio data', error);
      console.warn('Note: Supported file formats: mp3, wav, flac');
      return;
    }
  };

  const handleStartTranscribeFromMicrophone = async () => {
    setLiveTranscribing(true);
    setTranscription('');
    recorder.onAudioReady(({ buffer }) => {
      model.streamInsert(buffer.getChannelData(0));
    });
    recorder.start();

    try {
      await model.stream();
    } catch (error) {
      console.error('Error during live transcription:', error);
    }
  };

  const handleStopTranscribeFromMicrophone = () => {
    recorder.stop();
    model.streamStop();
    console.log('Live transcription stopped');
    setLiveTranscribing(false);
  };

  const getModelStatus = () => {
    if (model.error) return `${model.error}`;
    if (model.isGenerating) return 'Transcribing...';
    if (model.isReady) return 'Ready to transcribe';
    return `Loading model: ${(100 * model.downloadProgress).toFixed(2)}%`;
  };

  const readyToTranscribe = !model.isGenerating && model.isReady;
  const recordingButtonDisabled = isSimulator || !readyToTranscribe;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <SWMIcon width={60} height={60} />
            <Text style={styles.headerText}>React Native ExecuTorch</Text>
            <Text style={styles.headerText}>Speech to Text</Text>
          </View>

          <View style={styles.statusContainer}>
            <Text>Status: {getModelStatus()}</Text>
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
              <Text>
                {transcription !== ''
                  ? transcription
                  : model.committedTranscription +
                    model.nonCommittedTranscription}
              </Text>
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
