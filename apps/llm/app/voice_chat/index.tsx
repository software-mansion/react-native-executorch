import { useContext, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import SWMIcon from '../../assets/icons/swm_icon.svg';
import Spinner from 'react-native-loading-spinner-overlay';
import {
  STREAMING_ACTION,
  useSpeechToText,
  useLLM,
  QWEN3_0_6B_QUANTIZED,
} from 'react-native-executorch';
import PauseIcon from '../../assets/icons/pause_icon.svg';
import MicIcon from '../../assets/icons/mic_icon.svg';
import StopIcon from '../../assets/icons/stop_icon.svg';
import ColorPalette from '../../colors';
import Messages from '../../components/Messages';
import LiveAudioStream from 'react-native-live-audio-stream';
import DeviceInfo from 'react-native-device-info';
import { Buffer } from 'buffer';
import { useIsFocused } from '@react-navigation/native';
import { GeneratingContext } from '../../context';
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

export default function VoiceChatScreenWrapper() {
  const isFocused = useIsFocused();

  return isFocused ? <VoiceChatScreen /> : null;
}

function VoiceChatScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const messageRecorded = useRef<boolean>(false);
  const { setGlobalGenerating } = useContext(GeneratingContext);

  const llm = useLLM(QWEN3_0_6B_QUANTIZED);
  const speechToText = useSpeechToText({
    modelName: 'moonshine',
    windowSize: 3,
    overlapSeconds: 1.2,
  });

  useEffect(() => {
    setGlobalGenerating(llm.isGenerating || speechToText.isGenerating);
  }, [llm.isGenerating, speechToText.isGenerating, setGlobalGenerating]);

  const onChunk = (data: string) => {
    const float32Chunk = float32ArrayFromPCMBinaryBuffer(data);
    speechToText.streamingTranscribe(
      STREAMING_ACTION.DATA,
      Array.from(float32Chunk)
    );
  };

  const handleRecordPress = async () => {
    if (isRecording) {
      setIsRecording(false);
      LiveAudioStream.stop();
      messageRecorded.current = true;
      await llm.sendMessage(
        await speechToText.streamingTranscribe(STREAMING_ACTION.STOP)
      );
    } else {
      setIsRecording(true);
      startStreamingAudio(audioStreamOptions, onChunk);
      await speechToText.streamingTranscribe(STREAMING_ACTION.START);
    }
  };

  return !llm.isReady || !speechToText.isReady ? (
    <Spinner
      visible={!llm.isReady || !speechToText.isReady}
      textContent={`Loading the model ${(llm.downloadProgress * 100).toFixed(0)} %\nLoading the speech model ${(speechToText.downloadProgress * 100).toFixed(0)} %`}
    />
  ) : (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
      >
        <View style={styles.topContainer}>
          <SWMIcon width={45} height={45} />
          <Text style={styles.textModelName}>Qwen 3 x Moonshine</Text>
        </View>
        {llm.messageHistory.length || speechToText.sequence ? (
          <View style={styles.chatContainer}>
            <Messages
              chatHistory={
                speechToText.isGenerating
                  ? [
                      ...llm.messageHistory,
                      { role: 'user', content: speechToText.sequence },
                    ]
                  : llm.messageHistory
              }
              llmResponse={llm.response}
              isGenerating={llm.isGenerating}
              deleteMessage={llm.deleteMessage}
            />
          </View>
        ) : (
          <View style={styles.helloMessageContainer}>
            <Text style={styles.helloText}>Hello! 👋</Text>
            <Text style={styles.bottomHelloText}>
              What can I help you with?
            </Text>
          </View>
        )}
        <View style={styles.bottomContainer}>
          {DeviceInfo.isEmulatorSync() ? (
            <View style={styles.emulatorBox}>
              <Text style={[styles.emulatorWarning]}>
                recording disabled on emulator
              </Text>
            </View>
          ) : (
            <>
              {llm.isGenerating ? (
                <TouchableOpacity onPress={llm.interrupt}>
                  <PauseIcon height={40} width={40} padding={4} margin={8} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={
                    !isRecording ? styles.recordTouchable : styles.recordingInfo
                  }
                  onPress={handleRecordPress}
                >
                  {isRecording ? (
                    <StopIcon height={40} width={40} padding={4} margin={8} />
                  ) : (
                    <MicIcon height={40} width={40} padding={4} margin={8} />
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  topContainer: {
    height: 68,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 10,
    width: '100%',
  },
  textModelName: {
    color: ColorPalette.primary,
  },
  helloMessageContainer: {
    flex: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helloText: {
    fontFamily: 'medium',
    fontSize: 30,
    color: ColorPalette.primary,
  },
  bottomHelloText: {
    fontFamily: 'regular',
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
    color: ColorPalette.primary,
  },
  bottomContainer: {
    height: 100,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  recordTouchable: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emulatorBox: {
    padding: 10,
    margin: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: 'gray',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emulatorWarning: {
    color: 'gray',
    fontSize: 16,
  },
});
