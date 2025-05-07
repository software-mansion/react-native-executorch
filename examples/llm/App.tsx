import { useFonts } from 'expo-font';

import ScrollPicker from 'react-native-wheel-scrollview-picker';
import SWMIcon from './assets/icons/swm_icon.svg';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ChatScreenLLM, ChatScreenLLMToolCalling } from './screens/ChatScreen';
import { useState } from 'react';
import ColorPalette from './colors';
import { View, StyleSheet, Text } from 'react-native';

enum Mode {
  LLM,
  LLM_TOOL_CALLING,
}

export default function App() {
  useFonts({
    medium: require('./assets/fonts/Aeonik-Medium.otf'),
    regular: require('./assets/fonts/Aeonik-Regular.otf'),
  });
  const [selectedMode, setSelectedMode] = useState<Mode>(Mode.LLM);

  const handleModeChange = (mode: Mode) => {
    setSelectedMode(mode);
  };

  const renderScreen = () => {
    switch (selectedMode) {
      case Mode.LLM:
        return <ChatScreenLLM />;

      case Mode.LLM_TOOL_CALLING:
        return <ChatScreenLLMToolCalling />;

      default:
        return <ChatScreenLLM />;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.topContainer}>
          <SWMIcon width={45} height={45} />
          <Text style={styles.textModelName}>LLM on device demo</Text>
          <View style={styles.wheelPickerContainer}>
            <ScrollPicker
              dataSource={['Chat with LLM', 'Tool calling']}
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
        </View>

        {renderScreen()}
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
  topContainer: {
    marginTop: 5,
    height: 165,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelPickerContainer: {
    width: '100%',
    height: 120,
  },
  activeScrollItem: {
    color: ColorPalette.primary,
    fontWeight: 'bold',
  },
  textModelName: { color: ColorPalette.primary },
});
