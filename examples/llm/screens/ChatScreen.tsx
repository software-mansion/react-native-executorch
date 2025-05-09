import { useRef, useState } from 'react';
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
import SendIcon from '../assets/icons/send_icon.svg';
import PauseIcon from '../assets/icons/pause_icon.svg';
import ColorPalette from '../colors';

export default function ChatScreen() {
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const [userInput, setUserInput] = useState('');
  const textInputRef = useRef<TextInput>(null);

  const sendMessage = async () => {
    // setUserInput('');
    // textInputRef.current?.clear();
    // try {
    //   await llm.sendMessage(userInput);
    // } catch (e) {
    //   console.error(e);
    // }
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
        >
          <View style={styles.contentContainer}>
            <View style={styles.helloMessageContainer}>
              <Text style={styles.helloText}>Hello! 👋</Text>
              <Text style={styles.bottomHelloText}>
                What can I help you with?
              </Text>
            </View>
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
                  onPress={async () => false && (await sendMessage())}
                >
                  <SendIcon height={24} width={24} padding={4} margin={8} />
                </TouchableOpacity>
              )}
              {false && (
                <TouchableOpacity
                  style={styles.sendChatTouchable}
                  onPress={() => {}}
                >
                  <PauseIcon height={24} width={24} padding={4} margin={8} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  keyboardAvoidingView: { flex: 1 },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
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
    flex: 1,
    height: 60,
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
