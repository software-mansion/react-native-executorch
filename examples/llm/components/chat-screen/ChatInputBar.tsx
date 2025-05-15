import React, { Ref, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import SendIcon from '../../assets/icons/send_icon.svg';
import { ModelEntry } from '../../database/modelRepository';
import ColorPalette from '../../colors';

interface Props {
  isLoading: boolean;
  selectedModel: ModelEntry | null;
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
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <Text>Loading model...</Text>
      ) : !selectedModel ? (
        <TouchableOpacity style={styles.selectButton} onPress={onSelectModel}>
          <Text style={styles.selectButtonText}>Select Model</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TextInput
            ref={inputRef}
            style={{
              ...styles.input,
              borderColor: focused
                ? ColorPalette.blueDark
                : ColorPalette.blueLight,
            }}
            multiline
            placeholder="Your message"
            placeholderTextColor="#C1C6E5"
            value={userInput}
            onChangeText={setUserInput}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {!!userInput && (
            <TouchableOpacity style={styles.sendButton} onPress={onSend}>
              <SendIcon width={24} height={24} />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

export default ChatInputBar;

const styles = StyleSheet.create({
  container: {
    height: 100,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  selectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: ColorPalette.blueLight,
    borderRadius: 8,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectButtonText: {
    color: ColorPalette.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 14,
    padding: 12,
    color: ColorPalette.primary,
  },
  sendButton: {
    marginLeft: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
