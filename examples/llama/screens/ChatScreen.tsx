import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SWMIcon from '../assets/icons/swm_icon.svg';
import SendIcon from '../assets/icons/send_icon.svg';
import Spinner from 'react-native-loading-spinner-overlay';
import { LLAMA3_2_1B_QLORA, useLLM } from 'react-native-executorch';
import PauseIcon from '../assets/icons/pause_icon.svg';
import ColorPalette from '../colors';
import Messages from '../components/Messages';
import { MessageType, SenderType } from '../types';

export default function ChatScreen() {
  const [chatHistory, setChatHistory] = useState<Array<MessageType>>([]);
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const [userInput, setUserInput] = useState('');
  const llama = useLLM({
    modelSource: LLAMA3_2_1B_QLORA,
    tokenizerSource: require('../assets/tokenizer.bin'),
    contextWindowLength: 6,
  });
  const textInputRef = useRef<TextInput>(null);
  useEffect(() => {
    if (llama.response && !llama.isModelGenerating) {
      appendToMessageHistory(llama.response, 'ai');
    }
  }, [llama.response, llama.isModelGenerating]);

  const appendToMessageHistory = (input: string, role: SenderType) => {
    setChatHistory((prevHistory) => [
      ...prevHistory,
      { text: input, from: role },
    ]);
  };

  const sendMessage = async () => {
    appendToMessageHistory(userInput.trim(), 'user');
    setUserInput('');
    textInputRef.current?.clear();
    try {
      await llama.generate(userInput);
    } catch (e) {
      console.error(e);
    }
  };

  return !llama.isModelReady ? (
    <Spinner
      visible={!llama.isModelReady}
      textContent={`Loading the model ${(llama.downloadProgress * 100).toFixed(0)} %`}
    />
  ) : (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
        >
          <View style={styles.topContainer}>
            <SWMIcon width={45} height={45} />
            <Text style={styles.textModelName}>Llama 3.2 1B QLoRA</Text>
          </View>
          {chatHistory.length ? (
            <View style={styles.chatContainer}>
              <Messages
                chatHistory={chatHistory}
                llmResponse={llama.response}
                isModelGenerating={llama.isModelGenerating}
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
            <TextInput
              onFocus={() => setIsTextInputFocused(true)}
              onBlur={() => setIsTextInputFocused(false)}
              style={{
                ...styles.textInput,
                borderColor: isTextInputFocused
                  ? ColorPalette.blueDark
                  : ColorPalette.blueLight,
              }}
              placeholder="Your message"
              placeholderTextColor={'#C1C6E5'}
              multiline={true}
              ref={textInputRef}
              onChangeText={(text: string) => setUserInput(text)}
            />
            {userInput && (
              <TouchableOpacity
                style={styles.sendChatTouchable}
                onPress={async () =>
                  !llama.isModelGenerating && (await sendMessage())
                }
              >
                <SendIcon height={24} width={24} padding={4} margin={8} />
              </TouchableOpacity>
            )}
            {llama.isModelGenerating && (
              <TouchableOpacity
                style={styles.sendChatTouchable}
                onPress={llama.interrupt}
              >
                <PauseIcon height={24} width={24} padding={4} margin={8} />
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
  sendChatTouchable: {
    height: '100%',
    width: 48,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});
