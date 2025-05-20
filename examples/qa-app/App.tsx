import React, { useEffect, useState } from 'react';
import { MainScreen } from './screens/SpeechToTextScreen';
import {
  MULTI_QA_MINILM_L6_COS_V1,
  MULTI_QA_MINILM_L6_COS_V1_TOKENIZER,
  TokenizerModule,
  useTextEmbeddings,
} from 'react-native-executorch';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { slidingWindowSlice } from './utils';
import { DbCache, DbRow } from './types';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';

export default function App() {
  const [text, setText] = useState<string | null>(null);
  const [db, setDb] = useState<DbRow[]>([]);

  const encoder = useTextEmbeddings({
    modelSource: MULTI_QA_MINILM_L6_COS_V1,
    tokenizerSource: MULTI_QA_MINILM_L6_COS_V1_TOKENIZER,
  });

  const { forward, isReady } = encoder;
  useEffect(() => {
    if (isReady && !text) {
      (async () => {
        await TokenizerModule.load(MULTI_QA_MINILM_L6_COS_V1_TOKENIZER);

        const cachePath = `${FileSystem.cacheDirectory}${'db'}`;
        let fileInfo;
        try {
          fileInfo = await FileSystem.getInfoAsync(cachePath);
        } catch (error) {
          console.error('Error reading file:', error);
        }

        if (fileInfo && fileInfo.exists) {
          const jsonString = await FileSystem.readAsStringAsync(cachePath, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          const object: DbCache = JSON.parse(jsonString);
          console.log('loading cache - db length:', object.db.length);
          setText(object.text);
          setDb(object.db);
          return;
        }

        // read text
        const assets = await Asset.loadAsync(require('./assets/lotr1.txt'));
        if (assets.length !== 1 || !assets[0].localUri) {
          throw Error('Problem loading book txt file');
        }
        const newText = await FileSystem.readAsStringAsync(assets[0].localUri);
        setText(newText);

        console.log('text length:', newText.length);

        // Tokenize the text
        const tokens = await TokenizerModule.encode(newText);

        console.log('tokens length', tokens.length);

        // encode embeddings
        const slices = slidingWindowSlice(tokens, 256, 32);

        console.log('slices length', slices.length);

        const newDb: DbRow[] = [];
        let counter = 0;
        for (const slice of slices) {
          const sliceText = await TokenizerModule.decode(slice);
          const embedding = await forward(sliceText);

          newDb.push({ text: sliceText, embedding: embedding });
          if (counter % 50 === 0) {
            console.log(counter);
          }
          counter++;
        }

        console.log(newDb.length);
        setDb(newDb);

        const newCache: DbCache = { db: newDb, text: newText };

        const cacheString = JSON.stringify(newCache);
        try {
          await FileSystem.writeAsStringAsync(cachePath, cacheString);
          console.log('File written successfully!');
        } catch (error) {
          console.error('Error writing file:', error);
        }
        return;
      })();
    }
  }, [text, forward, isReady]);

  return (
    <SafeAreaProvider>
      <SafeAreaView>
        {db.length !== 0 ? (
          <MainScreen db={db} forward={forward} />
        ) : (
          <Text>Loading DB...</Text>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
