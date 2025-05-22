import { useFonts } from 'expo-font';
import ChatScreen from '../components/chat-screen/ChatScreen';
import { useDefaultHeader } from '../hooks/useDefaultHeader';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import SettingsHeaderButton from '../components/SettingsHeaderButton';
import { configureReanimatedLogger } from 'react-native-reanimated';

export default function App() {
  const navigation = useNavigation();
  useFonts({
    medium: require('../assets/fonts/Aeonik-Medium.otf'),
    regular: require('../assets/fonts/Aeonik-Regular.otf'),
  });
  useDefaultHeader();

  configureReanimatedLogger({
    strict: false,
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => <SettingsHeaderButton chatId={null} />,
    });
  }, [navigation]);

  return <ChatScreen chatId={null} messageHistory={[]} />;
}
