import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { ModelEntry } from '../database/modelRepository';
import Messages from '../components/Messages';
import ColorPalette from '../colors';
import ChatInputBar from '../components/chat-screen/ChatInputBar';
import ModelSelectorModal from '../components/chat-screen/ModelSelector';
import { useModelStore } from '../store/modelStore';
import { useLLMStore } from '../store/llmStore';
import { Message } from 'react-native-executorch';
import { getChatMessages } from '../database/chatRepository';
import { useChatStore } from '../store/chatStore';

interface ChatScreenProps {
  chatId: number | null;
}

export default function ChatScreen({ chatId }: ChatScreenProps) {
  const inputRef = useRef<TextInput>(null);
  const chatIdRef = useRef<number | null>(chatId);

  const { downloadedModels, loadModels } = useModelStore();
  const {
    db,
    setChatId,
    loadModel,
    model,
    sendChatMessage,
    response,
    isGenerating,
    isLoading,
    activeChatId,
    activeChatMessages,
  } = useLLMStore();
  const { addChat } = useChatStore();

  const [userInput, setUserInput] = useState('');
  const [showModelModal, setShowModelModal] = useState(false);
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);

  useEffect(() => {
    (async () => {
      if (chatId !== null) {
        const messages = await getChatMessages(db, chatIdRef.current!);
        setMessageHistory(messages);
      } else {
        setMessageHistory([]);
      }
    })();
    loadModels();
  }, [chatId, loadModels, db]);

  useEffect(() => {
    if (activeChatId === chatIdRef.current && activeChatMessages.length > 0) {
      setMessageHistory(activeChatMessages);
    }
  }, [activeChatMessages, activeChatId]);

  const handleSelectModel = async (selectedModel: ModelEntry) => {
    setShowModelModal(false);
    try {
      await loadModel(selectedModel);
    } catch (error) {
      console.error('Error loading model:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput || isGenerating) return;
    if (chatIdRef.current) {
      setChatId(chatIdRef.current);
    } else if (!chatIdRef.current) {
      const newChatId = await addChat();
      chatIdRef.current = newChatId!;
      setChatId(chatIdRef.current);
    }

    inputRef.current?.clear();
    setUserInput('');
    setMessageHistory((prev) => [
      ...prev,
      { role: 'user', content: userInput },
    ]);
    await sendChatMessage([
      ...messageHistory,
      { role: 'user', content: userInput },
    ]);
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
        >
          <View style={styles.header}>
            <Text style={styles.headerText}>
              {model ? (
                <>
                  Using model: <Text style={styles.modelName}>{model.id}</Text>{' '}
                  <Text
                    style={styles.changeModel}
                    onPress={() => setShowModelModal(true)}
                  >
                    (Change)
                  </Text>
                </>
              ) : (
                <>
                  No model selected{' '}
                  <Text
                    style={styles.changeModel}
                    onPress={() => setShowModelModal(true)}
                  >
                    (Select)
                  </Text>
                </>
              )}
            </Text>
          </View>

          <View style={styles.messages}>
            <Messages
              chatHistory={messageHistory}
              llmResponse={activeChatId === chatIdRef.current ? response : ''}
              isGenerating={isGenerating}
              deleteMessage={() => {}}
            />
          </View>

          <ChatInputBar
            isLoading={isLoading}
            selectedModel={model}
            userInput={userInput}
            setUserInput={setUserInput}
            onSend={handleSendMessage}
            onSelectModel={() => setShowModelModal(true)}
            inputRef={inputRef}
          />
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
      <ModelSelectorModal
        visible={showModelModal}
        models={downloadedModels}
        onSelect={handleSelectModel}
        onClose={() => setShowModelModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  headerText: {
    color: ColorPalette.primary,
    fontSize: 16,
  },
  modelName: {
    fontWeight: '600',
  },
  changeModel: {
    color: ColorPalette.blueDark,
    fontWeight: 'bold',
  },
  messages: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: '80%',
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
});
