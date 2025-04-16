import { useEffect, useRef, useState } from 'react';
import { useSpeechToText } from 'react-native-executorch';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SWMIcon from '../assets/icons/swm_icon.svg';
import Spinner from 'react-native-loading-spinner-overlay';
import {
  LLAMA3_2_1B_QLORA,
  LLAMA3_2_1B_TOKENIZER,
  useLLM,
} from 'react-native-executorch';
import PauseIcon from '../assets/icons/pause_icon.svg';
import MicIcon from '../assets/icons/mic_icon.svg';
import SendIcon from '../assets/icons/send_icon.svg';
import WebIcon from '../assets/icons/web_icon.svg';
import StopIcon from '../assets/icons/stop_icon.svg';
import ColorPalette from '../colors';
import Messages from '../components/Messages';
import { MessageType, SenderType } from '../types';
import InputPrompt from '../components/TextInputModal';
import LiveAudioStream from 'react-native-live-audio-stream';
import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system';
import { AudioContext } from 'react-native-audio-api';
import * as Speech from 'expo-speech';

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

export default function ChatScreen() {
  const [chatHistory, setChatHistory] = useState<Array<MessageType>>([]);
  const [audioUrl, setAudioUrl] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const [userInput, setUserInput] = useState('');
  const textInputRef = useRef<TextInput>(null);
  const audioBuffer = useRef<number[]>([]);
  const messageRecorded = useRef<boolean>(false);
  const mounted = useRef(false);
  const llama = useLLM({
    modelSource: LLAMA3_2_1B_QLORA,
    tokenizerSource: LLAMA3_2_1B_TOKENIZER,
    contextWindowLength: 6,
  });
  const speechToText = useSpeechToText({
    modelName: 'whisper',
    windowSize: 5,
    overlapSeconds: 1.2,
  });

  const onChunk = (data: string) => {
    const float32Chunk = float32ArrayFromPCMBinaryBuffer(data);
    audioBuffer.current.push(...float32Chunk);
  };

  const loadAudio = async (url: string) => {
    const audioContext = new AudioContext({ sampleRate: 16e3 });
    const audioBuffer = await FileSystem.downloadAsync(
      url,
      FileSystem.documentDirectory + '_tmp_transcribe_audio.mp3'
    ).then(({ uri }) => {
      return audioContext.decodeAudioDataSource(uri);
    });
    return audioBuffer?.getChannelData(0);
  };

  const handleRecordPress = async () => {
    if (isRecording) {
      setIsRecording(false);
      LiveAudioStream.stop();
      await speechToText.transcribe(audioBuffer.current);
      await llama.generate(speechToText.sequence);
      messageRecorded.current = true;
      audioBuffer.current = [];
    } else {
      setIsRecording(true);
      startStreamingAudio(audioStreamOptions, onChunk);
    }
  };

  const handleSendPress = async () => {
    if (userInput) {
      messageRecorded.current = false;
      appendToMessageHistory(userInput, 'user');
      setUserInput('');
      setIsTextInputFocused(false);
      textInputRef.current?.clear();
      try {
        if (!llama.isGenerating) await llama.generate(userInput);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    if (llama.response && !llama.isGenerating) {
      appendToMessageHistory(llama.response, 'assistant');
    }
  }, [llama.response, llama.isGenerating]);

  const modifyLastMessage = (content: string) => {
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      setChatHistory((prevHistory) => [
        ...prevHistory.slice(0, -1),
        { ...lastMessage, content },
      ]);
    } else {
      appendToMessageHistory(content, 'user');
    }
  };

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (speechToText.isGenerating) {
      if (speechToText.sequence) modifyLastMessage(speechToText.sequence);
      else modifyLastMessage('...');
    } else modifyLastMessage(speechToText.sequence);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechToText.sequence, speechToText.isGenerating]);

  const appendToMessageHistory = (content: string, role: SenderType) => {
    setChatHistory((prevHistory) => [...prevHistory, { role, content }]);
    if (role == 'assistant' && messageRecorded.current)
      Speech.speak(content, { language: 'en-US' });
  };

  return !llama.isReady || !speechToText.isReady ? (
    <Spinner
      visible={!llama.isReady || !speechToText.isReady}
      textContent={`Loading the model ${(llama.downloadProgress * 100).toFixed(0)} %\nLoading the speech model ${(speechToText.downloadProgress * 100).toFixed(0)} %`}
    />
  ) : (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
        >
          <View style={styles.topContainer}>
            <SWMIcon width={45} height={45} />
            <Text style={styles.textModelName}>
              Llama 3.2 1B QLoRA x Whisper
            </Text>
          </View>
          {chatHistory.length ? (
            <View style={styles.chatContainer}>
              <Messages
                chatHistory={chatHistory}
                llmResponse={llama.response}
                isGenerating={llama.isGenerating}
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
          <InputPrompt
            modalVisible={modalVisible}
            setModalVisible={async (visible: boolean) => {
              setModalVisible(visible);
              if (audioUrl) {
                await speechToText.transcribe(
                  Array.from(await loadAudio(audioUrl))
                );
              }
            }}
            onChangeText={setAudioUrl}
            value={audioUrl}
          />

          <View style={styles.bottomContainer}>
            {!isRecording && (
              <TouchableOpacity
                style={styles.fromUrlTouchable}
                onPress={async () => {
                  setModalVisible(true);
                }}
              >
                <WebIcon height={40} width={40} padding={4} margin={8} />
              </TouchableOpacity>
            )}
            <TextInput
              onFocus={() => setIsTextInputFocused(true)}
              onBlur={() => setIsTextInputFocused(false)}
              editable={!isRecording && !llama.isGenerating}
              style={{
                ...styles.textInput,
                borderColor: isTextInputFocused
                  ? ColorPalette.blueDark
                  : ColorPalette.blueLight,
                display: isRecording ? 'none' : 'flex',
              }}
              placeholder="Your message"
              placeholderTextColor={'#C1C6E5'}
              multiline={true}
              ref={textInputRef}
              onChangeText={(text: string) => setUserInput(text)}
            />
            {llama.isGenerating ? (
              <TouchableOpacity onPress={llama.interrupt}>
                <PauseIcon height={40} width={40} padding={4} margin={8} />
              </TouchableOpacity>
            ) : !userInput ? (
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
            ) : (
              <TouchableOpacity
                style={styles.recordTouchable}
                onPress={handleSendPress}
              >
                <SendIcon height={40} width={40} padding={4} margin={8} />
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    color: ColorPalette.primary,
  },
  bottomContainer: {
    height: 100,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    lineHeight: 19.6,
    fontFamily: 'regular',
    fontSize: 14,
    color: ColorPalette.primary,
    padding: 16,
  },
  fromUrlTouchable: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
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
});
