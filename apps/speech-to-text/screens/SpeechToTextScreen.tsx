import { MOONSHINE_TINY, useSpeechToText } from 'react-native-executorch';
import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import LiveAudioStream from 'react-native-live-audio-stream';
import SWMIcon from '../assets/swm_icon.svg';
import { useRef, useState } from 'react';
import { Buffer } from 'buffer';
import DeviceInfo from 'react-native-device-info';
import InputPrompt from '../components/TextInputModal';
import * as FileSystem from 'expo-file-system';
import { AudioContext } from 'react-native-audio-api';

const audioStreamOptions = {
  sampleRate: 16000,
  channels: 1,
  bitsPerSample: 16,
  audioSource: 1,
  bufferSize: 16000,
};

const startStreamingAudio = (options: any, onChunk: (data: string) => void) => {
  LiveAudioStream.init(options);
  LiveAudioStream.on('data', onChunk);
  LiveAudioStream.start();
};

const float32ArrayFromPCMBinaryBuffer = (b64EncodedBuffer: string) => {
  const b64DecodedChunk = Buffer.from(b64EncodedBuffer, 'base64');
  const int16Array = new Int16Array(b64DecodedChunk.buffer);

  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = Math.max(
      -1,
      Math.min(1, (int16Array[i] / audioStreamOptions.bufferSize) * 8)
    );
  }
  return float32Array;
};

export const SpeechToTextScreen = () => {
  const {
    isGenerating,
    isReady,
    downloadProgress,
    sequence,
    error,
    transcribe,
  } = useSpeechToText(MOONSHINE_TINY);

  const loadAudio = async (url: string) => {
    const audioContext = new AudioContext({ sampleRate: 16e3 });
    const audioBuffer = await FileSystem.downloadAsync(
      url,
      FileSystem.documentDirectory + '_tmp_transcribe_audio.mp3'
    ).then(({ uri }) => {
      return audioContext.decodeAudioDataSource(uri);
    });
    return Array.from(audioBuffer?.getChannelData(0));
  };

  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const audioBuffer = useRef<number[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const onChunk = (data: string) => {
    const float32Chunk = float32ArrayFromPCMBinaryBuffer(data);
    audioBuffer.current?.push(...float32Chunk);
  };

  const handleRecordPress = async () => {
    if (Platform.OS === 'android') {
      const permission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      if (!permission) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Microphone permission denied');
          return;
        }
      }
    }

    if (isRecording) {
      LiveAudioStream.stop();
      setIsRecording(false);
      await transcribe(audioBuffer.current);
      audioBuffer.current = [];
    } else {
      setIsRecording(true);
      startStreamingAudio(audioStreamOptions, onChunk);
    }
  };

  const buttonDisabled =
    modalVisible || isGenerating || !isReady || isRecording;
  const recordingButtonDisabled =
    modalVisible || !isReady || DeviceInfo.isEmulatorSync();

  return (
    <>
      <SafeAreaView style={styles.mainContainer}>
        <View style={styles.topContainer}>
          <SWMIcon width={80} height={80} />
          <Text style={styles.topContainerText}>
            {'React Native ExecuTorch'}
          </Text>
          <Text style={styles.topContainerText}>{'Speech to Text demo'}</Text>
        </View>
        {downloadProgress !== 1 ? (
          <View style={styles.transcriptionContainer}>
            <Text style={[styles.transcriptionText, styles.textGreyCenter]}>
              {`Downloading model: ${(Number(downloadProgress.toFixed(4)) * 100).toFixed(2)}%`}
            </Text>
          </View>
        ) : (
          <View style={styles.transcriptionContainer}>
            <Text
              style={
                sequence
                  ? styles.transcriptionText
                  : [styles.transcriptionText, styles.textGreyCenter]
              }
            >
              {sequence ||
                (isGenerating && 'Transcribing...') ||
                'Start transcription...'}
            </Text>
          </View>
        )}
        {error && (
          <Text
            style={[styles.transcriptionText, styles.redText]}
          >{`${error}`}</Text>
        )}
        <InputPrompt
          modalVisible={modalVisible}
          setModalVisible={async (visible: boolean) => {
            setModalVisible(visible);
            if (audioUrl) {
              const loadedAudio = await loadAudio(audioUrl);
              await transcribe(loadedAudio);
            }
          }}
          onChangeText={setAudioUrl}
          value={audioUrl}
        />
        <View style={styles.iconsContainer}>
          <View
            style={[
              styles.recordingButtonWrapper,
              buttonDisabled && styles.borderGrey,
            ]}
          >
            <TouchableOpacity
              disabled={buttonDisabled}
              style={[
                styles.recordingButton,
                buttonDisabled && styles.backgroundGrey,
              ]}
              onPress={async () => {
                if (!audioUrl) {
                  setModalVisible(true);
                } else {
                  const loadedAudio = await loadAudio(audioUrl);
                  await transcribe(loadedAudio);
                }
              }}
            >
              <Text style={[styles.recordingButtonText, styles.font13]}>
                TRANSCRIBE FROM URL
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.iconsContainer}>
          <View
            style={[
              styles.recordingButtonWrapper,
              recordingButtonDisabled && styles.borderGrey,
              isRecording && styles.borderRed,
            ]}
          >
            <TouchableOpacity
              disabled={recordingButtonDisabled || isGenerating}
              style={[
                styles.recordingButton,
                recordingButtonDisabled && styles.backgroundGrey,
                isRecording && styles.backgroundRed,
              ]}
              onPress={handleRecordPress}
            >
              <Text style={styles.recordingButtonText}>
                {isRecording ? 'STOP RECORDING' : 'START RECORDING'}
              </Text>
              {DeviceInfo.isEmulatorSync() && (
                <Text
                  style={[styles.recordingButtonText, styles.emulatorWarning]}
                >
                  recording does not work on emulator
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  textInput: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    width: '75%',
    borderRadius: 20,
  },
  imageContainer: {
    flex: 6,
    width: '100%',
    padding: 16,
  },
  image: {
    flex: 1,
    borderRadius: 8,
    width: '100%',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'white',
  },
  recordingButtonWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    borderWidth: 3,
    borderColor: '#001A72',
    borderRadius: 50,
  },
  recordingButton: {
    paddingVertical: 20,
    backgroundColor: '#001A72',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderRadius: 40,
  },
  topContainer: {
    marginTop: 80,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topContainerText: {
    height: 35,
    fontSize: 30,
    marginTop: 5,
    color: '#001A72',
    fontWeight: '600',
  },
  transcriptionContainer: {
    flex: 5,
    paddingTop: 80,
    width: '90%',
  },
  transcriptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  iconsContainer: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '60%',
  },
  recordingButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  textGreyCenter: {
    color: 'gray',
    textAlign: 'center',
  },
  redText: {
    color: 'red',
  },
  borderGrey: {
    borderColor: 'grey',
  },
  backgroundGrey: {
    backgroundColor: 'grey',
  },
  font13: {
    fontSize: 13,
  },
  borderRed: {
    borderColor: 'rgb(240, 63, 50)',
  },
  backgroundRed: {
    backgroundColor: 'rgb(240, 63, 50)',
  },
  emulatorWarning: {
    color: 'rgb(254, 148, 141)',
    fontSize: 11,
  },
});
