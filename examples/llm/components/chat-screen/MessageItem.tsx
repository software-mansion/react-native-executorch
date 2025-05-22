import React, { memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MarkdownComponent from './MarkdownComponent';
import LlamaIcon from '../../assets/icons/llama_icon.svg';
import ColorPalette from '../../colors';
import { Message } from '../../database/chatRepository';

interface MessageItemProps {
  message: Message;
}

const MessageItem = memo(({ message }: MessageItemProps) => {
  const isAssistant = message.role === 'assistant';

  return (
    <View style={isAssistant ? styles.aiMessage : styles.userMessage}>
      {isAssistant && (
        <View style={styles.iconBubble}>
          <LlamaIcon width={24} height={24} />
        </View>
      )}
      <View style={styles.bubbleContent}>
        <MarkdownComponent text={message.content} />
        {isAssistant && message.tokensPerSecond !== undefined && (
          <Text style={styles.meta}>
            ⏱️ {message.timeToFirstToken?.toFixed()} ms • ⚡{' '}
            {message.tokensPerSecond?.toFixed(2)} tok/s
          </Text>
        )}
      </View>
    </View>
  );
});

export default MessageItem;

const styles = StyleSheet.create({
  aiMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginHorizontal: 12,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  userMessage: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginHorizontal: 12,
    maxWidth: '85%',
    alignSelf: 'flex-end',
    backgroundColor: ColorPalette.seaBlueLight,
    borderRadius: 12,
    padding: 12,
  },
  iconBubble: {
    backgroundColor: ColorPalette.seaBlueLight,
    height: 32,
    width: 32,
    borderRadius: 16,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleContent: {
    flexShrink: 1,
  },
  meta: {
    fontSize: 12,
    marginTop: 8,
    color: ColorPalette.blueDark,
  },
});
