import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import ChatScreen from '../../components/chat-screen/ChatScreen';
import { useDefaultHeader } from '../../hooks/useDefaultHeader';
import { useLayoutEffect } from 'react';
import { TouchableOpacity, Text } from 'react-native';

export default function ChatScreenWrapper() {
  useDefaultHeader();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = id ? Number(id) : null;

  useLayoutEffect(() => {
    if (id) {
      navigation.setOptions({
        title: `Chat #${id}`,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push(`/chat/${id}/settings`)}
            style={{ paddingHorizontal: 16 }}
          >
            <Text style={{ fontSize: 16 }}>⚙️</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, id]);

  return <ChatScreen chatId={chatId} setChat={() => {}} />;
}
