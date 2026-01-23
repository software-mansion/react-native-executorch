import React from 'react';
import { SpeechToTextScreen } from './screens/SpeechToTextScreen';
import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from '@rn-executorch/expo-adapter';

initExecutorch({
  resourceFetcher: ExpoResourceFetcher,
});

export default function App() {
  return <SpeechToTextScreen />;
}
