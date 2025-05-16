import { useFonts } from 'expo-font';
import ChatScreen from '../components/chat-screen/ChatScreen';
import { useDefaultHeader } from '../hooks/useDefaultHeader';

export default function App() {
  useFonts({
    medium: require('../assets/fonts/Aeonik-Medium.otf'),
    regular: require('../assets/fonts/Aeonik-Regular.otf'),
  });
  useDefaultHeader();

  return <ChatScreen chatId={null} />;
}
