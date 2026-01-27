import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  initExecutorch,
  useLLM,
  LLAMA3_2_1B_SPINQUANT,
} from 'react-native-executorch';
import { BareResourceFetcher } from '@rn-executorch/bare-adapter';
import { setConfig } from '@kesha-antonov/react-native-background-downloader';

// Configure Background Downloader logging
setConfig({
  isLogsEnabled: true,
  logCallback: log => {
    console.log('[BackgroundDownloader]', log);
  },
});

// Initialize Executorch with bare adapter
initExecutorch({
  resourceFetcher: BareResourceFetcher,
});

const ColorPalette = {
  primary: '#001A72',
  blueLight: '#C1C6E5',
  blueDark: '#6676AA',
  white: '#FFFFFF',
  gray100: '#F5F5F5',
  gray200: '#E0E0E0',
};

function Spinner({
  visible,
  textContent,
}: {
  visible: boolean;
  textContent: string;
}) {
  return (
    <Modal transparent={true} animationType="fade" visible={visible}>
      <View style={spinnerStyles.overlay}>
        <View style={spinnerStyles.container}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={spinnerStyles.text}>{textContent}</Text>
        </View>
      </View>
    </Modal>
  );
}

const spinnerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 15,
    color: ColorPalette.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

function App() {
  const [userInput, setUserInput] = useState('');
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const llm = useLLM({ model: LLAMA3_2_1B_SPINQUANT });
  // Alternatively, to use a custom local model, uncomment below:
  // const llm = useLLM({ model: {
  //   modelSource: require('./assets/ai-models/smolLm2/smolLm2_135M/smolLm2_135M_bf16.pte'),
  //   tokenizerSource: require('./assets/ai-models/smolLm2/tokenizer.json'),
  //   tokenizerConfigSource: require('./assets/ai-models/smolLm2/tokenizer_config.json'),
  // } });

  useEffect(() => {
    if (llm.error) {
      console.log('LLM error:', llm.error);
    }
  }, [llm.error]);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    setUserInput('');
    textInputRef.current?.clear();
    try {
      await llm.sendMessage(userInput);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Spinner
        visible={!llm.isReady}
        textContent={`Loading model ${(llm.downloadProgress * 100).toFixed(0)}%`}
      />

      <View style={styles.content}>
        {llm.messageHistory.length > 0 || llm.isGenerating ? (
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatContainer}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
            keyboardShouldPersistTaps="handled"
          >
            {llm.messageHistory.map((message, index) => (
              <View
                key={index}
                style={[
                  styles.messageBubble,
                  message.role === 'user'
                    ? styles.userMessage
                    : styles.aiMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user'
                      ? styles.userMessageText
                      : styles.aiMessageText,
                  ]}
                >
                  {message.content}
                </Text>
              </View>
            ))}
            {llm.isGenerating && llm.response && (
              <View style={[styles.messageBubble, styles.aiMessage]}>
                <Text style={styles.aiMessageText}>{llm.response}</Text>
                <ActivityIndicator size="small" color={ColorPalette.primary} />
              </View>
            )}
          </ScrollView>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Hello! 👋</Text>
              <Text style={styles.welcomeSubtitle}>
                What can I help you with?
              </Text>
            </View>
          </TouchableWithoutFeedback>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            ref={textInputRef}
            style={[
              styles.textInput,
              {
                borderColor: isTextInputFocused
                  ? ColorPalette.blueDark
                  : ColorPalette.blueLight,
              },
            ]}
            placeholder="Your message"
            placeholderTextColor={ColorPalette.blueLight}
            multiline
            onFocus={() => setIsTextInputFocused(true)}
            onBlur={() => setIsTextInputFocused(false)}
            onChangeText={setUserInput}
            value={userInput}
          />
          {userInput.trim() && !llm.isGenerating && (
            <View style={styles.sendButton}>
              <Text style={styles.sendButtonText} onPress={sendMessage}>
                Send
              </Text>
            </View>
          )}
          {llm.isGenerating && (
            <View style={styles.sendButton}>
              <Text style={styles.sendButtonText} onPress={llm.interrupt}>
                Stop
              </Text>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.white,
  },
  content: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    width: '100%',
  },
  chatContent: {
    padding: 16,
    flexGrow: 1,
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: ColorPalette.primary,
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: ColorPalette.blueDark,
    textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: ColorPalette.primary,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: ColorPalette.gray100,
    borderWidth: 1,
    borderColor: ColorPalette.gray200,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: ColorPalette.white,
  },
  aiMessageText: {
    color: ColorPalette.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: ColorPalette.gray200,
    alignItems: 'flex-end',
    backgroundColor: ColorPalette.white,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: ColorPalette.primary,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: ColorPalette.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: ColorPalette.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
