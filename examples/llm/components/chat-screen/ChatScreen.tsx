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
import { router } from 'expo-router';
import { useModelStore } from '../../store/modelStore';
import { useLLMStore } from '../../store/llmStore';
import { useChatStore } from '../../store/chatStore';
import { getChatMessages } from '../../database/chatRepository';
import { Message } from 'react-native-executorch';
import { Model } from '../../database/modelRepository';
import Messages from './Messages';
import ChatInputBar from './ChatInputBar';
import ModelSelectorModal from './ModelSelector';
import ColorPalette from '../../colors';

interface ChatScreenProps {
  chatId: number | null;
  setChat: (chatId: number) => void;
}

export default function ChatScreen({ chatId, setChat }: ChatScreenProps) {
  const inputRef = useRef<TextInput>(null);
  const chatIdRef = useRef<number | null>(chatId);

  const { downloadedModels, loadModels } = useModelStore();
  const {
    db,
    model,
    loadModel,
    response,
    isLoading,
    isGenerating,
    sendChatMessage,
    activeChatId,
    activeChatMessages,
    setChatId,
  } = useLLMStore();
  const { addChat } = useChatStore();

  const [userInput, setUserInput] = useState('');
  const [showModelModal, setShowModelModal] = useState(false);
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);

  useEffect(() => {
    (async () => {
      if (chatId !== null && db !== null) {
        const messages = await getChatMessages(db, chatIdRef.current!);
        setMessageHistory(messages);
      } else {
        setMessageHistory([]);
      }
    })();
    loadModels();
  }, [chatId, db, loadModels]);

  useEffect(() => {
    if (activeChatId === chatIdRef.current && activeChatMessages.length > 0) {
      setMessageHistory(activeChatMessages);
    }
  }, [activeChatMessages, activeChatId]);

  const handleSelectModel = async (selectedModel: Model) => {
    setShowModelModal(false);
    try {
      await loadModel(selectedModel);
    } catch (error) {
      console.error('Error loading model:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isGenerating) return;

    if (chatIdRef.current) {
      setChatId(chatIdRef.current);
    } else {
      const newChatId = await addChat();
      chatIdRef.current = newChatId!;
      setChatId(chatIdRef.current);
      setChat(newChatId!);
      router.replace(`/chat/${newChatId}`);
    }

    const newMessage: Message = { role: 'user', content: userInput };
    inputRef.current?.clear();
    setUserInput('');
    setMessageHistory((prev) => [...prev, newMessage]);

    await sendChatMessage([...messageHistory, newMessage]);
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 100}
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

          <View style={styles.messagesContainer}>
            <Messages
              chatHistory={messageHistory}
              llmResponse={
                activeChatId === chatIdRef.current && chatIdRef.current !== null
                  ? response
                  : ''
              }
              isGenerating={isGenerating}
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
    borderBottomColor: ColorPalette.seaBlueDark,
    backgroundColor: ColorPalette.seaBlueLight,
  },
  headerText: {
    fontSize: 16,
    color: ColorPalette.primary,
  },
  modelName: {
    fontWeight: '600',
    color: ColorPalette.primary,
  },
  changeModel: {
    color: ColorPalette.blueDark,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fdfdfd',
  },
});
