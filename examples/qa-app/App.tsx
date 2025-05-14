import React from 'react';
import { MainScreen } from './screens/SpeechToTextScreen';
import {
  ALL_MINILM_L6_V2,
  ALL_MINILM_L6_V2_TOKENIZER,
  useTextEmbeddings,
} from 'react-native-executorch';
import { readAsStringAsync } from 'expo-file-system';
import { Asset } from 'expo-asset';

const { localUri } = await Asset.fromModule(
  require('../assets/lotr1.txt')
).downloadAsync();
let textContent = '';
if (localUri) {
  textContent = await readAsStringAsync(localUri);
}

export default function App() {
  const encoder = useTextEmbeddings({
    modelSource: ALL_MINILM_L6_V2,
    tokenizerSource: ALL_MINILM_L6_V2_TOKENIZER,
  });

  console.log(encoder);
  console.log(textContent);

  return <MainScreen />;
}
