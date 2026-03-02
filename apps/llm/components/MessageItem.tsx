import React, { memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Platform,
} from 'react-native';
import MarkdownComponent from './MarkdownComponent';
import LlamaIcon from '../assets/icons/llama_icon.svg';
import ColorPalette from '../colors';
import { Message } from 'react-native-executorch';

interface MessageItemProps {
  message: Message;
  deleteMessage: () => void;
}

const MessageItem = memo(({ message, deleteMessage }: MessageItemProps) => {
  if (message.role === 'assistant') {
    return (
      <View style={styles.aiMessage}>
        <View style={styles.aiMessageIconContainer}>
          <LlamaIcon width={24} height={24} />
        </View>
        <MarkdownComponent text={message.content} />
        <CloseButton deleteMessage={deleteMessage} role={message.role} />
      </View>
    );
  }

  return (
    <View style={styles.userMessageWrapper}>
      <CloseButton deleteMessage={deleteMessage} role={message.role} />
      <View style={styles.userMessageBubble}>
        {message.mediaPath && (
          <Image
            source={{ uri: message.mediaPath }}
            style={styles.userMessageImage}
            resizeMode="cover"
          />
        )}
        <MarkdownComponent text={message.content} />
      </View>
    </View>
  );
});

const CloseButton = ({
  deleteMessage,
  role,
}: {
  deleteMessage: () => void;
  role: string;
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.closeButton,
        role === 'assistant' ? styles.closeButtonRight : styles.closeButtonLeft,
      ]}
      onPress={deleteMessage}
    >
      <Text style={styles.buttonText}>✕</Text>
    </TouchableOpacity>
  );
};

export default MessageItem;

const styles = StyleSheet.create({
  aiMessage: {
    flexDirection: 'row',
    maxWidth: '75%',
    alignSelf: 'flex-start',
    marginVertical: 8,
    alignItems: 'center',
  },
  userMessageWrapper: {
    flexDirection: 'row-reverse',
    marginRight: 8,
    marginVertical: 8,
    maxWidth: '75%',
    alignSelf: 'flex-end',
    alignItems: 'flex-start',
  },
  userMessageBubble: {
    flexDirection: 'column',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: ColorPalette.seaBlueLight,
  },
  userMessageImage: {
    width: 200,
    height: 150,
    borderRadius: 6,
    marginBottom: 6,
  },
  aiMessageIconContainer: {
    backgroundColor: ColorPalette.seaBlueLight,
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginHorizontal: 7,
  },
  closeButton: {
    borderRadius: 11,
    backgroundColor: ColorPalette.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
  },
  closeButtonRight: {
    marginLeft: 8,
  },
  closeButtonLeft: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: Platform.OS === 'ios' ? 16 : 14,
    color: '#000',
  },
});
