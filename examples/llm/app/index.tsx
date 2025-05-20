import { useFonts } from 'expo-font';
import ChatScreen from '../components/chat-screen/ChatScreen';
import { useDefaultHeader } from '../hooks/useDefaultHeader';
import { router, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';

export default function App() {
  const navigation = useNavigation();
  const [chatId, setChatId] = useState<number | null>(null);
  useFonts({
    medium: require('../assets/fonts/Aeonik-Medium.otf'),
    regular: require('../assets/fonts/Aeonik-Regular.otf'),
  });
  useDefaultHeader();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push(`/chat/${chatId}/settings`)}
          style={{ paddingHorizontal: 16 }}
        >
          <Text style={{ fontSize: 16 }}>⚙️</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, chatId]);

  return <ChatScreen chatId={chatId} setChat={setChatId} />;
}
