import React, { useMemo } from 'react';
import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import {
  MOONSHINE_TINY,
  STREAMING_ACTION,
  useSpeechToText,
} from 'react-native-executorch';
import {
  AudioManager,
  AudioRecorder,
  AudioContext,
} from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system';
import SWMIcon from '../assets/swm_icon.svg';

const SAMPLE_RATE = 16000;
const AUDIO_LENGTH_SECONDS = 1;
const BUFFER_LENGTH = SAMPLE_RATE * AUDIO_LENGTH_SECONDS;

export const SpeechToTextScreen = () => {
  const model = useSpeechToText({
    model: MOONSHINE_TINY,
    streamingConfig: 'balanced',
    windowSize: 3,
    overlapSeconds: 1.2,
  });

  const recorder = useMemo(
    () =>
      new AudioRecorder({
        sampleRate: SAMPLE_RATE,
        bufferLengthInSamples: BUFFER_LENGTH,
      }),
    []
  );

  const handleTranscribeFromURL = async (url: string) => {
    const { uri } = await FileSystem.downloadAsync(
      url,
      FileSystem.cacheDirectory + 'audio_file.mp3'
    );
    const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    const audioBuffer = (
      await audioContext.decodeAudioDataSource(uri)
    ).getChannelData(0);
    const audioArray = Array.from(audioBuffer);
    await model.streamingTranscribe(STREAMING_ACTION.START);
    for (let i = 0; i < audioArray.length / SAMPLE_RATE; i++) {
      await model.streamingTranscribe(
        STREAMING_ACTION.DATA,
        audioArray.slice(i * SAMPLE_RATE, (i + 1) * SAMPLE_RATE)
      );
    }
    await model.streamingTranscribe(STREAMING_ACTION.STOP);

    // await model.transcribe(audioArray);
  };

  const handleStartTranscribeFromMicrophone = async () => {
    await model.streamingTranscribe(STREAMING_ACTION.START);
    console.log('Live transcription started');

    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetooth', 'defaultToSpeaker'],
    });

    recorder.onAudioReady(async ({ buffer }) => {
      const buffor = buffer.getChannelData(0);
      const bufforArray = Array.from(buffor);
      model.streamingTranscribe(STREAMING_ACTION.DATA, bufforArray);
    });

    recorder.start();
  };

  const handleStopTranscribeFromMicrophone = async () => {
    recorder.stop();
    await model.streamingTranscribe(STREAMING_ACTION.STOP);
    console.log('Live transcription stopped');
  };

  const getModelStatus = () => {
    if (model.error) return `${model.error}`;
    if (model.isGenerating) return 'Transcribing...';
    if (model.isReady) return 'Ready to transcribe';
    return `Loading model: ${(100 * model.downloadProgress).toFixed(2)}%`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <SWMIcon width={60} height={60} />
        <Text style={styles.headerText}>React Native ExecuTorch</Text>
        <Text style={styles.headerText}>Speech to Text</Text>
      </View>

      <View style={styles.statusContainer}>
        <Text>Model: {MOONSHINE_TINY.modelName}</Text>
        <Text>Status: {getModelStatus()}</Text>
      </View>

      <ScrollView style={styles.transcriptionContainer}>
        <Text>{model.sequence}</Text>
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.urlTranscriptionContainer}>
          <TextInput
            placeholder="Audio file URL to transcribe"
            style={styles.urlTranscriptionInput}
          />
          <TouchableOpacity
            onPress={() =>
              handleTranscribeFromURL(
                'https://ai.swmansion.com/storage/audio_long.mp3'
              )
            }
            style={styles.urlTranscriptionButton}
          >
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
        </View>

        {model.isGenerating ? (
          <TouchableOpacity
            onPress={handleStopTranscribeFromMicrophone}
            style={[styles.liveTranscriptionButton, styles.backgroundRed]}
          >
            <Text style={styles.buttonText}> Stop Live Transcription</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleStartTranscribeFromMicrophone}
            style={[styles.liveTranscriptionButton, styles.backgroundBlue]}
          >
            <Text style={styles.buttonText}> Start Live Transcription</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
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
    marginTop: 16,
    alignItems: 'center',
  },
  transcriptionContainer: {
    flex: 1,
    width: '100%',
    margin: 16,
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
    borderColor: '#0f186e',
    borderWidth: 1,
    padding: 16,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  urlTranscriptionButton: {
    backgroundColor: '#0f186e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  liveTranscriptionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  backgroundRed: {
    backgroundColor: 'red',
  },
  backgroundBlue: {
    backgroundColor: '#0f186e',
  },
});
