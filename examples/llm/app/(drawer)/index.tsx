import { useFonts } from 'expo-font';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ChatScreen from '../../screens/ChatScreen';
import { StyleSheet } from 'react-native';

export default function App() {
  useFonts({
    medium: require('../../assets/fonts/Aeonik-Medium.otf'),
    regular: require('../../assets/fonts/Aeonik-Regular.otf'),
  });

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ChatScreen />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
});
