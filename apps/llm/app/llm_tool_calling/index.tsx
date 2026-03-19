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
  Linking,
  Alert,
  AppState,
} from 'react-native';
import SWMIcon from '../../assets/icons/swm_icon.svg';
import SendIcon from '../../assets/icons/send_icon.svg';
import Spinner from '../../components/Spinner';
import {
  useLLM,
  DEFAULT_SYSTEM_PROMPT,
  HAMMER2_1_1_5B_QUANTIZED,
} from 'react-native-executorch';
import { ModelPicker } from '../../components/ModelPicker';
import { LLM_MODELS, LLMModelSources } from '../../components/llmModels';
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
  const [hasCalendarPermission, setHasCalendarPermission] = useState(true);
  const [hasBrightnessPermission, setHasBrightnessPermission] = useState(true);
  const [selectedModel, setSelectedModel] = useState<LLMModelSources>(
    HAMMER2_1_1_5B_QUANTIZED
  );
  const textInputRef = useRef<TextInput>(null);
  const { setGlobalGenerating } = useContext(GeneratingContext);

  const llm = useLLM({ model: selectedModel });

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
      console.error('LLM error:', llm.error);
    }
  }, [llm.error]);

  const requestCalendarPermission = async () => {
    const { status, canAskAgain } =
      await Calendar.getCalendarPermissionsAsync();

    if (status === Calendar.PermissionStatus.GRANTED) {
      setHasCalendarPermission(true);
      return;
    }

    if (status === Calendar.PermissionStatus.UNDETERMINED || canAskAgain) {
      const { status: nextStatus } =
        await Calendar.requestCalendarPermissionsAsync();
      setHasCalendarPermission(
        nextStatus === Calendar.PermissionStatus.GRANTED
      );
      return;
    }

    setHasCalendarPermission(false);
    Alert.alert(
      'Calendar Permission Required',
      'To read or add events, the app requires "Full Access" to your calendar. Please enable this in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  };

  const requestBrightnessPermission = async () => {
    const { status, canAskAgain } = await Brightness.getPermissionsAsync();

    if (status === Brightness.PermissionStatus.GRANTED) {
      setHasBrightnessPermission(true);
      return;
    }

    if (status === Brightness.PermissionStatus.UNDETERMINED || canAskAgain) {
      const { status: nextStatus } = await Brightness.requestPermissionsAsync();
      setHasBrightnessPermission(
        nextStatus === Brightness.PermissionStatus.GRANTED
      );
      return;
    }

    setHasBrightnessPermission(false);
    Alert.alert(
      'Brightness Permission Required',
      'To change screen brightness, the app requires permission. Please enable this in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  };

  useEffect(() => {
    requestCalendarPermission();
    requestBrightnessPermission();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        requestCalendarPermission();
        requestBrightnessPermission();
      }
    });

    return () => {
      subscription.remove();
    };
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
      textContent={`Loading the model ${(llm.downloadProgress * 100).toFixed(0)} %`}
    />
  ) : (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={{ ...styles.container }}
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

          {!hasCalendarPermission && (
            <TouchableOpacity
              style={styles.permissionBanner}
              onPress={requestCalendarPermission}
            >
              <Text style={styles.permissionBannerText}>
                Calendar access is required.{' '}
                <Text style={styles.permissionBannerLink}>Grant Access</Text>
              </Text>
            </TouchableOpacity>
          )}
          {!hasBrightnessPermission && (
            <TouchableOpacity
              style={styles.permissionBanner}
              onPress={requestBrightnessPermission}
            >
              <Text style={styles.permissionBannerText}>
                Brightness access is required.{' '}
                <Text style={styles.permissionBannerLink}>Grant Access</Text>
              </Text>
            </TouchableOpacity>
          )}

          <ModelPicker
            models={LLM_MODELS}
            selectedModel={selectedModel}
            onSelect={(m) => setSelectedModel(m)}
            disabled={llm.isGenerating}
          />

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
              placeholder={isTextInputFocused ? '' : 'Your message'}
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
    padding: 20,
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
  permissionBanner: {
    backgroundColor: '#FFF3CD',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  permissionBannerText: {
    fontFamily: 'regular',
    fontSize: 13,
    color: '#856404',
  },
  permissionBannerLink: {
    fontFamily: 'medium',
    color: ColorPalette.blueDark,
  },
});
