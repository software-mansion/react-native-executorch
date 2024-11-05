import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { MessageType } from '../types';
import MarkdownComponent from './MarkdownComponent';
import LlamaIcon from '../assets/icons/llama_icon.svg';
import ColorPalette from '../colors';

interface MessageItemProps {
  message: MessageType;
}

const MessageItem = memo(({ message }: MessageItemProps) => {
  return (
    <View style={message.from === 'ai' ? styles.aiMessage : styles.userMessage}>
      {message.from === 'ai' && (
        <View style={styles.aiMessageIconContainer}>
          <LlamaIcon width={24} height={24} />
        </View>
      )}
      <MarkdownComponent text={message.text} />
    </View>
  );
});

export default MessageItem;

const styles = StyleSheet.create({
  aiMessage: {
    flexDirection: 'row',
    maxWidth: '80%',
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  userMessage: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginVertical: 8,
    maxWidth: 220,
    borderRadius: 8,
    backgroundColor: ColorPalette.seaBlueLight,
    alignSelf: 'flex-end',
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
  messageText: {
    fontSize: 14,
    lineHeight: 19.6,
    color: ColorPalette.primary,
    fontFamily: 'regular',
  },
});
