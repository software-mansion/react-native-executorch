import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TextToSpeechScreen } from './screens/TextToSpeechScreen';
import { SpeechToTextScreen } from './screens/SpeechToTextScreen';
import ColorPalette from './colors';
import ExecutorchLogo from './assets/executorch.svg';
import { Quiz } from './screens/Quiz';
import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from '@rn-executorch/expo-adapter';

initExecutorch({
  resourceFetcher: ExpoResourceFetcher,
});

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<
    'menu' | 'speech-to-text' | 'text-to-speech' | 'quiz'
  >('menu');

  const goToMenu = () => setCurrentScreen('menu');

  if (currentScreen === 'text-to-speech') {
    return <TextToSpeechScreen onBack={goToMenu} />;
  }

  if (currentScreen === 'speech-to-text') {
    return <SpeechToTextScreen onBack={goToMenu} />;
  }

  if (currentScreen === 'quiz') {
    return <Quiz onBack={goToMenu} />;
  }

  return (
    <View style={styles.container}>
      <ExecutorchLogo width={64} height={64} />
      <Text style={styles.headerText}>Select a demo model</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setCurrentScreen('speech-to-text')}
        >
          <Text style={styles.buttonText}>Speech to Text</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setCurrentScreen('text-to-speech')}
        >
          <Text style={styles.buttonText}>Text to Speech</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setCurrentScreen('quiz')}
        >
          <Text style={styles.buttonText}>Text to Speech - Quiz</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const fontSizes = {
  xxl: 34,
  xl: 22,
  lg: 18,
  md: 16,
  sm: 14,
  xs: 12,
  xxs: 10,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerText: {
    fontSize: fontSizes.lg,
    color: ColorPalette.strongPrimary,
    margin: 20,
  },
  buttonContainer: {
    width: '80%',
    justifyContent: 'space-evenly',
    marginBottom: 20,
  },
  button: {
    backgroundColor: ColorPalette.strongPrimary,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: fontSizes.md,
  },
});
