import React, { useEffect, useState } from 'react';
import { MainScreen } from './screens/SpeechToTextScreen';
import {
  MULTI_QA_MINILM_L6_COS_V1,
  MULTI_QA_MINILM_L6_COS_V1_TOKENIZER,
  useTextEmbeddings,
  useTokenizer,
} from 'react-native-executorch';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { findClosestEmbedding, slidingWindowSlice } from './utils';

interface DbRow {
  text: string;
  embedding: number[];
}

export default function App() {
  const [text, setText] = useState<string | null>(null);
  const [result, setResult] = useState<{
    index: number;
    similarity: number;
    embedding: number[];
  } | null>(null);
  const [db, setDb] = useState<DbRow[]>([]);

  const encoder = useTextEmbeddings({
    modelSource: MULTI_QA_MINILM_L6_COS_V1,
    tokenizerSource: MULTI_QA_MINILM_L6_COS_V1_TOKENIZER,
  });

  const tokenizer = useTokenizer({
    tokenizerSource: MULTI_QA_MINILM_L6_COS_V1_TOKENIZER,
  });

  console.log('rerender');
  console.log(encoder);

  const { forward, isReady } = encoder;

  useEffect(() => {
    if (isReady && !text) {
      console.log('run processing');
      (async () => {
        // TODO caching
        // const cachePath = `${FileSystem.cacheDirectory}${'db'}`;
        // try {
        //   const fileInfo = await FileSystem.getInfoAsync(path);
        //   if (fileInfo.exists) {
        //     const jsonString = await FileSystem.readAsStringAsync(path, {
        //       encoding: FileSystem.EncodingType.UTF8,
        //     });
        //     const object = JSON.parse(jsonString);
        //     console.log('File read successfully:', object);
        //     return object;
        //   } else {
        //     console.log('File does not exist.');
        //   }
        // } catch (error) {
        //   console.error('Error reading file:', error);
        // }

        // read file
        const assets = await Asset.loadAsync(require('./assets/lotr1.txt'));
        if (assets.length !== 1 || !assets[0].localUri) {
          throw Error('Problem loading book txt file');
        }
        const newText = await FileSystem.readAsStringAsync(assets[0].localUri);
        setText(newText);

        console.log('text length:', newText.length);

        // Tokenize the text
        const tokens = await tokenizer.encode(newText);

        console.log('tokens length', tokens.length);

        // encode embeddings
        const slices = slidingWindowSlice(tokens, 256, 32);

        console.log('slices length', slices.length);

        const newDb: DbRow[] = [];
        let counter = 0;
        for (const slice of slices) {
          let time = performance.now();
          const sliceText = await tokenizer.decode(slice);
          console.log('tokenizer.decode() time:', performance.now() - time);
          time = performance.now();
          const embedding = await forward(sliceText);
          console.log('encoder.forward() time:', performance.now() - time);
          // console.log(
          //   '###########',
          //   counter,
          //   '\nslice:',
          //   slice,
          //   '\nsliceText:',
          //   sliceText,
          //   '\nembedding:',
          //   embedding
          // );
          newDb.push({ text: sliceText, embedding: embedding });
          if (counter % 1 === 0) {
            console.log(counter);
          }
          counter++;
        }

        console.log(newDb.length);
        setDb(newDb);

        // TODO caching
        // const jsonString = JSON.stringify(newDb);
        // try {
        //   await FileSystem.writeAsStringAsync(path, jsonString);
        //   console.log('File written successfully!');
        // } catch (error) {
        //   console.error('Error writing file:', error);
        // }
      })();
    }
  }, [text, forward, isReady, tokenizer]);

  useEffect(() => {
    // test useEffect
    if (!result && encoder.isReady && !encoder.isGenerating) {
      let queryEmbedding: number[] = [];
      (async () => {
        queryEmbedding = await encoder.forward('What do hobbits eat?');
      })();

      if (db.length > 0) {
        const newResult = findClosestEmbedding(
          queryEmbedding,
          db.map((row) => row.embedding)
        );

        console.log(
          newResult.index,
          db[newResult.index].text,
          newResult.similarity
        );
        setResult(newResult);
      }
    }
  }, [encoder, db, result]);

  return <MainScreen />;
}
