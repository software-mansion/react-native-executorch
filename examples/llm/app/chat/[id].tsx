import { useLocalSearchParams, useNavigation } from 'expo-router';
import ChatScreen from '../../components/chat-screen/ChatScreen';
import { useDefaultHeader } from '../../hooks/useDefaultHeader';
import { useLayoutEffect } from 'react';
import SettingsHeaderButton from '../../components/SettingsHeaderButton';

export default function ChatScreenWrapper() {
  useDefaultHeader();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = id ? Number(id) : null;

  useLayoutEffect(() => {
    if (id) {
      navigation.setOptions({
        title: `Chat #${id}`,
        // eslint-disable-next-line react/no-unstable-nested-components
        headerRight: () => <SettingsHeaderButton chatId={chatId} />,
      });
    }
  }, [navigation, chatId, id]);

  return <ChatScreen chatId={chatId} setChat={() => {}} />;
}
