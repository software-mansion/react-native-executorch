import { useRef } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import AnimatedChatLoading from './AnimatedChatLoading';
import LlamaIcon from '../assets/icons/llama_icon.svg';
import ColorPalette from '../colors';
import MessageItem from './MessageItem';
import { Message } from 'react-native-executorch';

interface MessagesComponentProps {
  chatHistory: Message[];
  llmResponse: string;
  isGenerating: boolean;
  deleteMessage: (index: number) => void;
}

export default function Messages({
  chatHistory,
  llmResponse,
  isGenerating,
  deleteMessage,
}: MessagesComponentProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <View style={styles.chatContainer}>
      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef?.current?.scrollToEnd()}
      >
        <View onStartShouldSetResponder={() => true}>
          {chatHistory.map((message, index) => (
            <MessageItem
              key={index}
              message={message}
              deleteMessage={() => deleteMessage(index)}
            />
          ))}
          {isGenerating && (
            <View style={styles.aiMessage}>
              <View style={styles.aiMessageIconContainer}>
                <LlamaIcon width={24} height={24} />
              </View>
              {!llmResponse ? (
                <View style={styles.messageLoadingContainer}>
                  <AnimatedChatLoading />
                </View>
              ) : (
                <Text style={styles.messageText}> {llmResponse.trim()}</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chatContainer: { flex: 1, width: '100%' },
  aiMessage: {
    flexDirection: 'row',
    maxWidth: '80%',
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  messageLoadingContainer: { width: 28 },
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
