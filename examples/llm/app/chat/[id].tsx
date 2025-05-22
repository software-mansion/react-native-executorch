import { useLocalSearchParams, useNavigation } from 'expo-router';
import ChatScreen from '../../components/chat-screen/ChatScreen';
import { useDefaultHeader } from '../../hooks/useDefaultHeader';
import { useEffect, useLayoutEffect, useState } from 'react';
import SettingsHeaderButton from '../../components/SettingsHeaderButton';
import { getChatMessages, Message } from '../../database/chatRepository';
import { useLLMStore } from '../../store/llmStore';

export default function ChatScreenWrapper() {
  useDefaultHeader();
  const { activeChatId, activeChatMessages, db } = useLLMStore();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = id ? Number(id) : null;
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);

  useLayoutEffect(() => {
    if (chatId) {
      navigation.setOptions({
        title: `Chat #${chatId}`,
        // eslint-disable-next-line react/no-unstable-nested-components
        headerRight: () => <SettingsHeaderButton chatId={chatId} />,
      });
    }
  }, [navigation, chatId]);

  useEffect(() => {
    (async () => {
      if (chatId !== null && db !== null) {
        const messages = await getChatMessages(db, chatId);
        setMessageHistory(messages);
      } else {
        setMessageHistory([]);
      }
    })();
  }, [chatId, db]);

  useEffect(() => {
    if (activeChatId === chatId && activeChatMessages.length > 0) {
      setMessageHistory(activeChatMessages);
    }
  }, [activeChatMessages, activeChatId, chatId]);

  return <ChatScreen chatId={chatId} messageHistory={messageHistory} />;
}
