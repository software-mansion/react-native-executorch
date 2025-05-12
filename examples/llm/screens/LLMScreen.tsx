import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SendIcon from '../assets/icons/send_icon.svg';
import Spinner from 'react-native-loading-spinner-overlay';
import {
  LLAMA3_2_1B_QLORA,
  LLAMA3_2_TOKENIZER,
  LLAMA3_2_TOKENIZER_CONFIG,
  useLLM,
} from 'react-native-executorch';
import PauseIcon from '../assets/icons/pause_icon.svg';
import ColorPalette from '../colors';
import Messages from '../components/Messages';

export default function LLMScreen() {
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const [userInput, setUserInput] = useState('');

  const llm = useLLM({
    modelSource: LLAMA3_2_1B_QLORA,
    tokenizerSource: LLAMA3_2_TOKENIZER,
    tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
  });

  useEffect(() => {
    if (llm.error) {
      console.log('LLM error:', llm.error);
    }
  }, [llm.error]);

  const textInputRef = useRef<TextInput>(null);

  const sendMessage = async () => {
    setUserInput('');
    textInputRef.current?.clear();
    try {
      await llm.sendMessage(userInput);
    } catch (e) {
      console.error(e);
    }
  };

  return !llm.isReady ? (
    <Spinner
      visible={!llm.isReady}
      textContent={`Loading the model ${(llm.downloadProgress * 100).toFixed(0)} %`}
    />
  ) : (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        {llm.messageHistory.length ? (
          <View style={styles.chatContainer}>
            <Messages
              chatHistory={llm.messageHistory}
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
          <TextInput
            autoCorrect={false}
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
              onPress={async () => !llm.isGenerating && (await sendMessage())}
            >
              <SendIcon height={24} width={24} padding={4} margin={8} />
            </TouchableOpacity>
          )}
          {llm.isGenerating && (
            <TouchableOpacity
              style={styles.sendChatTouchable}
              onPress={llm.interrupt}
            >
              <PauseIcon height={24} width={24} padding={4} margin={8} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatContainer: { flex: 10, width: '100%' },
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
