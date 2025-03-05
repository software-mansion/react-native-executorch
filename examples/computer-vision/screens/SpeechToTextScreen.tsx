import { useSpeechToText } from 'react-native-executorch';
import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import LiveAudioStream from 'react-native-live-audio-stream';
import SWMIcon from '../assets/icons/swm_icon.svg';
import { useRef, useState } from 'react';
import { Buffer } from 'buffer';

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
  const { sequence, transcribe } = useSpeechToText({ modelName: 'moonshine' });
  const [isRecording, setIsRecording] = useState(false);
  const audioBuffer = useRef<number[]>([]);

  const onChunk = (data: string) => {
    const float32Chunk = float32ArrayFromPCMBinaryBuffer(data);
    console.log('psuhing buffer', float32Chunk.length);
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

  return (
    <>
      <SafeAreaView style={styles.mainContainer}>
        <View style={styles.topContainer}>
          <SWMIcon />
          <Text style={styles.topContainerText}>
            {'React Native ExecuTorch - Speech to Text demo'}
          </Text>
        </View>
        <View style={styles.transcriptionContainer}>
          <Text
            style={
              sequence
                ? styles.transcriptionText
                : { ...styles.transcriptionText, color: 'gray' }
            }
          >
            {sequence || 'Start recording to transcribe audio...'}
          </Text>
        </View>
        <View style={styles.iconsContainer}>
          <View
            style={[
              styles.recordingButtonWrapper,
              isRecording && { borderColor: 'rgb(240, 63, 50)' },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.recordingButton,
                isRecording && { backgroundColor: 'rgba(240, 63, 50, 0.8)' },
              ]}
              onPress={handleRecordPress}
            >
              <Text style={styles.recordingButtonText}>
                {isRecording ? 'STOP RECORDING' : 'START RECORDING'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topContainerText: {
    fontSize: 16,
    marginTop: 6,
    color: 'black',
    fontWeight: '600',
  },
  transcriptionContainer: {
    flex: 9,
    paddingTop: 20,
    width: '90%',
  },
  transcriptionText: {
    fontSize: 24,
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
