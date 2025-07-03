import { useContext, useEffect, useRef, useState } from 'react';
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
import SWMIcon from '../../assets/icons/swm_icon.svg';
import SendIcon from '../../assets/icons/send_icon.svg';
import Spinner from 'react-native-loading-spinner-overlay';
import {
  HAMMER2_1_1_5B,
  useLLM,
  DEFAULT_SYSTEM_PROMPT,
} from 'react-native-executorch';
import PauseIcon from '../../assets/icons/pause_icon.svg';
import ColorPalette from '../../colors';
import Messages from '../../components/Messages';
import * as Brightness from 'expo-brightness';
import * as Calendar from 'expo-calendar';
import { executeTool, TOOL_DEFINITIONS_PHONE } from '../../utils/tools';
import { useIsFocused } from '@react-navigation/native';
import { GeneratingContext } from '../../context';

export default function LLMToolCallingScreenWrapper() {
  const isFocused = useIsFocused();

  return isFocused ? <LLMToolCallingScreen /> : null;
}

function LLMToolCallingScreen() {
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const [userInput, setUserInput] = useState('');
  const textInputRef = useRef<TextInput>(null);
  const { setGlobalGenerating } = useContext(GeneratingContext);

  const llm = useLLM(HAMMER2_1_1_5B);

  useEffect(() => {
    setGlobalGenerating(llm.isGenerating);
  }, [llm.isGenerating, setGlobalGenerating]);

  const { configure } = llm;
  useEffect(() => {
    configure({
      chatConfig: {
        systemPrompt: `${DEFAULT_SYSTEM_PROMPT} Current time and date: ${new Date().toString()}`,
      },
      toolsConfig: {
        tools: TOOL_DEFINITIONS_PHONE,
        executeToolCallback: executeTool,
        displayToolCalls: true,
      },
    });
  }, [configure]);

  useEffect(() => {
    if (llm.error) {
      console.log('LLM error:', llm.error);
    }
  }, [llm.error]);

  // PERMISSIONS
  useEffect(() => {
    (async () => {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        console.log(
          'No access to calendar! We need this to use app correctly!'
        );
      }
    })();

    (async () => {
      const { status } = await Brightness.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log(
          'No access to brightness! We need this to use app correctly!'
        );
      }
    })();
  }, []);

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
      textContent={`Loading the model ${(llm.downloadProgress * 100).toFixed(
        0
      )} %`}
    />
  ) : (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={{
            ...styles.container,
          }}
          collapsable={false}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 40}
        >
          <View style={styles.topContainer}>
            <SWMIcon width={45} height={45} />
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
                I can use calendar! Ask me to check it or add an event for you!
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
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: Platform.OS === 'android' ? 20 : 0 },
  keyboardAvoidingView: { flex: 1 },
  topContainer: {
    height: 68,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: { flex: 10, width: '100%' },
  textModelName: { color: ColorPalette.primary },
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
