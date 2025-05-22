import React, { Ref } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import SendIcon from '../../assets/icons/send_icon.svg';
import { Model } from '../../database/modelRepository';
import ColorPalette from '../../colors';

interface Props {
  isLoading: boolean;
  selectedModel: Model | null;
  userInput: string;
  setUserInput: (text: string) => void;
  onSend: () => void;
  onSelectModel: () => void;
  inputRef: Ref<TextInput>;
}

const ChatInputBar = ({
  isLoading,
  selectedModel,
  userInput,
  setUserInput,
  onSend,
  onSelectModel,
  inputRef,
}: Props) => {
  return (
    <View style={styles.container}>
      {isLoading ? (
        <Text style={styles.selectButtonText}>Loading model...</Text>
      ) : !selectedModel ? (
        <TouchableOpacity onPress={onSelectModel}>
          <Text style={styles.selectButtonText}>
            Model not loaded. Please initialize the model.
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={{
              ...styles.input,
            }}
            multiline
            placeholder="Your message"
            placeholderTextColor={ColorPalette.blueDark}
            value={userInput}
            onChangeText={setUserInput}
          />
          <View style={styles.buttonBar}>
            <TouchableOpacity style={styles.sendButton} onPress={onSend}>
              <SendIcon width={24} height={24} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default ChatInputBar;

const styles = StyleSheet.create({
  container: {
    height: 112,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 12,
    paddingTop: 12,
    backgroundColor: ColorPalette.seaBlueLight,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  selectButtonText: {
    color: ColorPalette.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'column',
    flex: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 12,
    color: ColorPalette.primary,
  },
  sendButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
