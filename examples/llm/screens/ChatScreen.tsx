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
import SendIcon from '../assets/icons/send_icon.svg';
import Spinner from 'react-native-loading-spinner-overlay';
import {
  HAMMER2_1_1_5B,
  HAMMER2_1_TOKENIZER,
  HAMMER2_1_TOKENIZER_CONFIG,
  LLAMA3_2_1B_QLORA,
  LLAMA3_2_TOKENIZER,
  LLAMA3_2_TOKENIZER_CONFIG,
  LLMType,
  LLMTool,
  useLLM,
} from 'react-native-executorch';
import PauseIcon from '../assets/icons/pause_icon.svg';
import ColorPalette from '../colors';
import Messages from '../components/Messages';

export const ChatScreenLLM = () => {
  const llm = useLLM({
    modelSource: LLAMA3_2_1B_QLORA,
    tokenizerSource: LLAMA3_2_TOKENIZER,
    tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
  });

  return <ChatScreen llm={llm} />;
};

export const ChatScreenLLMToolCalling = () => {
  const llm = useLLM({
    modelSource: HAMMER2_1_1_5B,
    tokenizerSource: HAMMER2_1_TOKENIZER,
    tokenizerConfigSource: HAMMER2_1_TOKENIZER_CONFIG,
    toolsConfig: {
      tools: TOOL_DEFINITIONS_PHONE,
      // we don't implement any tool execution here
      // we just want to showcase model's ability
      executeToolCallback: async () => {
        return null;
      },
      // just for demo purpose
      displayToolCalls: true,
    },
  });

  return <ChatScreen llm={llm} />;
};

export default function ChatScreen({ llm }: { llm: LLMType }) {
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const [userInput, setUserInput] = useState('');

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
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
        >
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
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const TOOL_DEFINITIONS_PHONE: LLMTool[] = [
  {
    name: 'brightness',
    description:
      'Change screen brightness. Change can be relative (higher/lower) or set to minimal or maximal.',
    parameters: {
      type: 'dict',
      properties: {
        relativeChange: {
          type: 'number',
          description:
            'Relative change of brightness (from 0 to 100). Change should be negative if user asks for less bright screen.',
        },
        targetBrightness: {
          type: 'number',
          description: 'Relative change of brightness (from 0 to 100).',
        },
      },
    },
  },
  {
    name: 'get_contacts',
    description:
      'Gets user phone contacts. Returns both name and phone number.',
    parameters: {
      type: 'dict',
      properties: {
        name: {
          type: 'string',
          description:
            'Full or partial name of person to retrieve. Those will be some part of names or letters, not numbers.',
        },
        phoneNumberPrefix: {
          type: 'string',
          description:
            'Prefix or part of phone number of contact to retrieve. Those will be numbers.',
        },
      },
    },
  },
  {
    name: 'send_sms',
    description: 'Sends SMS/text message to specified user.',
    parameters: {
      type: 'dict',
      properties: {
        to: { type: 'string', description: 'The recipient phone number.' },
        body: { type: 'string', description: 'Body of the text message.' },
      },
      required: ['to', 'body'],
    },
  },
  {
    name: 'read_calendar',
    description: 'Read calendar events from now up to given point in time',
    parameters: {
      type: 'dict',
      properties: {
        time: {
          type: 'string',
          description: 'Date and time to which we want to read calendar',
        },
      },
      required: ['time'],
    },
  },
  {
    name: 'add_event_to_calendar',
    description: 'Schedules event in your calendar at given time.',
    parameters: {
      type: 'dict',
      properties: {
        time: { type: 'string', description: 'Date and time of an event.' },
        title: { type: 'string', description: 'Title of an event' },
        description: { type: 'string', description: 'Description of an event' },
      },
      required: ['time', 'title'],
    },
  },
  {
    name: 'flashlight',
    description: 'Turns the flashlight on/off',
    parameters: {
      type: 'dict',
      properties: {
        turn_on: { type: 'boolean', description: 'Turns the flashlight on.' },
        turn_off: { type: 'boolean', description: 'Turns the flashlight off.' },
      },
      required: ['turn_on', 'turn_off'],
    },
  },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
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
