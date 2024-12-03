import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChatScreen from './screens/ChatScreen';
import StyleTransfer from './screens/StyleTransfer';

export default function App() {
  useFonts({
    medium: require('./assets/fonts/Aeonik-Medium.otf'),
    regular: require('./assets/fonts/Aeonik-Regular.otf'),
  });

  return (
    <SafeAreaProvider>
      <StyleTransfer />
    </SafeAreaProvider>
  );
}
