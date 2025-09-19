import { useContext, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import SendIcon from '../../assets/icons/send_icon.svg';
import { useLLM, LLAMA3_2_1B_SPINQUANT } from 'react-native-executorch';
import PauseIcon from '../../assets/icons/pause_icon.svg';
import ColorPalette from '../../colors';
import Messages from '../../components/Messages';
import { useIsFocused } from '@react-navigation/native';
import { GeneratingContext } from '../../context';
import Spinner from '../../components/Spinner';

export default function LLMScreenWrapper() {
  const isFocused = useIsFocused();
  return isFocused ? <LLMScreen /> : null;
}

function LLMScreen() {
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const [userInput, setUserInput] = useState('');
  const textInputRef = useRef<TextInput>(null);
  const { setGlobalGenerating } = useContext(GeneratingContext);

  const llm = useLLM({ model: LLAMA3_2_1B_SPINQUANT });

  useEffect(() => {
    if (llm.error) {
      console.log('LLM error:', llm.error);
    }
  }, [llm.error]);

  useEffect(() => {
    setGlobalGenerating(llm.isGenerating);
  }, [llm.isGenerating, setGlobalGenerating]);

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
      <KeyboardAvoidingView
        style={{
          ...styles.container,
        }}
        collapsable={false}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 40}
      >
        <View style={styles.container}>
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
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    paddingBottom: Platform.OS === 'android' ? 20 : 0,
  },
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
    textAlign: 'center',
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
