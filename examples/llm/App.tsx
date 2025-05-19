import { useFonts } from 'expo-font';

import ScrollPicker from 'react-native-wheel-scrollview-picker';
import SWMIcon from './assets/icons/swm_icon.svg';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import ColorPalette from './colors';
import {
  View,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LLMScreen from './screens/LLMScreen';
import LLMToolCallingScreen from './screens/LLMToolCallingScreen';
import VoiceChatScreen from './screens/VocieChatScreen';

enum Mode {
  LLM,
  LLM_VOICE_CHAT,
  LLM_TOOL_CALLING,
}

export default function App() {
  useFonts({
    medium: require('./assets/fonts/Aeonik-Medium.otf'),
    regular: require('./assets/fonts/Aeonik-Regular.otf'),
  });
  const [selectedMode, setSelectedMode] = useState<Mode>(Mode.LLM);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleModeChange = (mode: Mode) => {
    if (!isGenerating) {
      setSelectedMode(mode);
    }
  };

  const renderScreen = () => {
    switch (selectedMode) {
      case Mode.LLM:
        return <LLMScreen setIsGenerating={setIsGenerating} />;

      case Mode.LLM_VOICE_CHAT:
        return <VoiceChatScreen setIsGenerating={setIsGenerating} />;

      case Mode.LLM_TOOL_CALLING:
        return <LLMToolCallingScreen setIsGenerating={setIsGenerating} />;

      default:
        return <LLMScreen setIsGenerating={setIsGenerating} />;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
        >
          <View style={styles.topContainer}>
            <SWMIcon width={45} height={45} />
            <Text style={styles.textModelName}>LLM on device demo</Text>
            {!isGenerating ? (
              <View style={styles.wheelPickerContainer}>
                <ScrollPicker
                  dataSource={['Chat with LLM', 'Talk to LLM', 'Tool calling']}
                  onValueChange={(_, selectedIndex) => {
                    handleModeChange(selectedIndex);
                  }}
                  wrapperHeight={120}
                  highlightColor={ColorPalette.primary}
                  wrapperBackground="#fff"
                  highlightBorderWidth={3}
                  itemHeight={40}
                  activeItemTextStyle={styles.activeScrollItem}
                />
              </View>
            ) : (
              <Text style={styles.placeholderText}>
                Model is generating. Interrupt to swap models!
              </Text>
            )}
          </View>

          {renderScreen()}
        </KeyboardAvoidingView>
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
  keyboardAvoidingView: { flex: 1 },
  topContainer: {
    marginTop: 5,
    height: 165,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelPickerContainer: { width: '100%', height: 120 },
  activeScrollItem: { color: ColorPalette.primary, fontWeight: 'bold' },
  textModelName: { color: ColorPalette.primary },
  placeholderText: {
    color: ColorPalette.primary,
    fontSize: 25,
    marginTop: 20,
    textAlign: 'center',
  },
});
