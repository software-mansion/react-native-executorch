import { useEffect, useRef, useState } from 'react';
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
import SWMIcon from '../assets/icons/swm_icon.svg';
import Spinner from 'react-native-loading-spinner-overlay';
import {
  useLLM,
  QWEN3_0_6B_QUANTIZED,
  QWEN3_TOKENIZER,
  QWEN3_TOKENIZER_CONFIG,
} from 'react-native-executorch';
import PauseIcon from '../assets/icons/pause_icon.svg';
import SendIcon from '../assets/icons/send_icon.svg';
import ColorPalette from '../colors';
import Messages from '../components/Messages';

export default function LLMScreen({
  setIsGenerating,
}: {
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const [userInput, setUserInput] = useState('');
  const textInputRef = useRef<TextInput>(null);

  const llm = useLLM({
    modelSource: QWEN3_0_6B_QUANTIZED,
    tokenizerSource: QWEN3_TOKENIZER,
    tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
  });

  useEffect(() => {
    setIsGenerating(llm.isGenerating);
  }, [llm.isGenerating, setIsGenerating]);

  const sendMessage = async () => {
    if (userInput) {
      llm.sendMessage(userInput);
      setUserInput('');
      setIsTextInputFocused(false);
      textInputRef.current?.clear();
    }
  };

  return !llm.isReady ? (
    <Spinner
      visible={!llm.isReady}
      textContent={`Loading the model ${(llm.downloadProgress * 100).toFixed(0)} %\n`}
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
          <Text style={styles.textModelName}>Qwen 3 x Whisper</Text>
        </View>
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
            onFocus={() => setIsTextInputFocused(true)}
            onBlur={() => setIsTextInputFocused(false)}
            editable={!!llm.isGenerating}
            style={{
              ...styles.textInput,
              borderColor: isTextInputFocused
                ? ColorPalette.blueDark
                : ColorPalette.blueLight,
              display: 'flex',
            }}
            placeholder="Your message"
            placeholderTextColor={'#C1C6E5'}
            multiline={true}
            ref={textInputRef}
            onChangeText={(text: string) => setUserInput(text)}
          />
          {llm.isGenerating ? (
            <TouchableOpacity onPress={llm.interrupt}>
              <PauseIcon height={40} width={40} padding={4} margin={8} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.recordTouchable}
              onPress={async () => !llm.isGenerating && (await sendMessage())}
            >
              <SendIcon height={40} width={40} padding={4} margin={8} />
            </TouchableOpacity>
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
  recordTouchable: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
