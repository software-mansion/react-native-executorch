import { useSpeechToText } from 'react-native-executorch';
import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import LiveAudioStream from 'react-native-live-audio-stream';
import SWMIcon from '../assets/swm_icon.svg';
import { useRef, useState } from 'react';
import { Buffer } from 'buffer';
import DeviceInfo from 'react-native-device-info';
import InputPrompt from '../components/TextInputModal';

const options = {
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
      Math.min(1, (int16Array[i] / options.bufferSize) * 8)
    );
  }
  return float32Array;
};

export const SpeechToTextScreen = () => {
  const {
    isModelGenerating,
    isModelReady,
    downloadProgress,
    sequence,
    error,
    transcribe,
    loadAudio,
  } = useSpeechToText({ modelName: 'moonshine' });
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const audioBuffer = useRef<number[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const onChunk = (data: string) => {
    const float32Chunk = float32ArrayFromPCMBinaryBuffer(data);
    audioBuffer.current?.push(...float32Chunk);
  };

  const handleRecordPress = async () => {
    if (isRecording) {
      LiveAudioStream.stop();
      setIsRecording(false);
      await transcribe(audioBuffer.current);
      audioBuffer.current = [];
    } else {
      setIsRecording(true);
      startStreamingAudio(options, onChunk);
    }
  };

  const buttonDisabled =
    modalVisible || isModelGenerating || !isModelReady || isRecording;
  const recordingButtonDisabled =
    modalVisible || !isModelReady || DeviceInfo.isEmulatorSync();

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
            <Text
              style={{
                ...styles.transcriptionText,
                color: 'gray',
                textAlign: 'center',
              }}
            >
              {`Downloading model: ${(Number(downloadProgress.toFixed(4)) * 100).toFixed(2)}%`}
            </Text>
          </View>
        ) : (
          <View style={styles.transcriptionContainer}>
            <Text
              style={
                sequence
                  ? styles.transcriptionText
                  : {
                      ...styles.transcriptionText,
                      color: 'gray',
                      textAlign: 'center',
                    }
              }
            >
              {sequence ||
                (isModelGenerating && 'Transcribing...') ||
                'Start transcription...'}
            </Text>
          </View>
        )}
        {error && (
          <Text
            style={{ ...styles.transcriptionText, color: 'red' }}
          >{`${error}`}</Text>
        )}
        <InputPrompt
          modalVisible={modalVisible}
          setModalVisible={async (visible: boolean) => {
            setModalVisible(visible);
            if (audioUrl) {
              await loadAudio(audioUrl);
              await transcribe();
            }
          }}
          onChangeText={setAudioUrl}
          value={audioUrl}
        />
        <View style={styles.iconsContainer}>
          <View
            style={[
              styles.recordingButtonWrapper,
              buttonDisabled && {
                borderColor: 'grey',
              },
            ]}
          >
            <TouchableOpacity
              disabled={buttonDisabled}
              style={[
                styles.recordingButton,
                buttonDisabled && {
                  backgroundColor: 'grey',
                },
              ]}
              onPress={async () => {
                if (!audioUrl) {
                  setModalVisible(true);
                } else {
                  await loadAudio(audioUrl);
                  await transcribe();
                }
              }}
            >
              <Text style={{ ...styles.recordingButtonText, fontSize: 13 }}>
                {'TRANSCRIBE FROM URL'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.iconsContainer}>
          <View
            style={[
              styles.recordingButtonWrapper,
              recordingButtonDisabled && {
                borderColor: 'grey',
              },
              isRecording && { borderColor: 'rgb(240, 63, 50)' },
            ]}
          >
            <TouchableOpacity
              disabled={recordingButtonDisabled || isModelGenerating}
              style={[
                styles.recordingButton,
                recordingButtonDisabled && {
                  backgroundColor: 'grey',
                },
                isRecording && { backgroundColor: 'rgb(240, 63, 50)' },
              ]}
              onPress={handleRecordPress}
            >
              <Text style={styles.recordingButtonText}>
                {isRecording ? 'STOP RECORDING' : 'START RECORDING'}
              </Text>
              {DeviceInfo.isEmulatorSync() && (
                <Text
                  style={{
                    ...styles.recordingButtonText,
                    color: 'rgb(254, 148, 141)',
                    fontSize: 11,
                  }}
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
    height: '100%',
    fontSize: 30,
    marginTop: 5,
    color: '#001A72',
    fontWeight: '600',
  },
  transcriptionContainer: {
    flex: 9,
    paddingTop: 100,
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
});
