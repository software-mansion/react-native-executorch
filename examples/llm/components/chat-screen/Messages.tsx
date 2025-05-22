import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import AnimatedChatLoading from './AnimatedChatLoading';
import MessageItem from './MessageItem';
import LlamaIcon from '../../assets/icons/llama_icon.svg';
import ColorPalette from '../../colors';
import { Message } from '../../database/chatRepository';

interface Props {
  chatHistory: Message[];
  llmResponse: string;
  isGenerating: boolean;
}

const Messages = ({ chatHistory, llmResponse, isGenerating }: Props) => {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [chatHistory, llmResponse, isGenerating]);

  const isEmpty = chatHistory.length === 0 && !isGenerating;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View onStartShouldSetResponder={() => true}>
          {chatHistory.map((message, index) => (
            <MessageItem key={`${message.role}-${index}`} message={message} />
          ))}

          {isGenerating && (
            <View style={styles.aiRow}>
              <View style={styles.iconBubble}>
                <LlamaIcon width={24} height={24} />
              </View>

              {!llmResponse ? (
                <View style={styles.loadingWrapper}>
                  <AnimatedChatLoading />
                </View>
              ) : (
                <Text style={styles.responseText}>{llmResponse.trim()}</Text>
              )}
            </View>
          )}

          {isEmpty && (
            <Text style={styles.emptyState}>
              Start a conversation to see messages here.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Messages;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  aiRow: {
    flexDirection: 'row',
    maxWidth: '85%',
    alignSelf: 'flex-start',
    marginVertical: 8,
    marginHorizontal: 12,
  },
  loadingWrapper: {
    height: 20,
    justifyContent: 'center',
    paddingTop: 4,
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
  responseText: {
    fontSize: 14,
    lineHeight: 20,
    color: ColorPalette.primary,
    fontFamily: 'regular',
    flexShrink: 1,
  },
  emptyState: {
    textAlign: 'center',
    color: ColorPalette.blueDark,
    marginTop: 24,
    fontStyle: 'italic',
    fontSize: 13,
  },
});
