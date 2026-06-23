import type { WorkletRuntime } from 'react-native-worklets';

import { wrapAsync } from '../../../core/runtime';
import { loadTokenizer } from '../tokenizer';

/**
 * Loads a tokenizer and exposes its operations with lifetime management for the
 * `useTokenizer` hook.
 * @category Typescript API
 * @param tokenizerPath Absolute local path to a `tokenizer.json` file.
 * @param runtime Optional worklet runtime thread to run the tokenizer on.
 * @returns A promise resolving to the tokenizer operations and a `dispose`
 * handle that releases the native tokenizer.
 */
export async function createTokenizer(tokenizerPath: string, runtime?: WorkletRuntime) {
  const tokenizer = await wrapAsync(loadTokenizer, runtime)(tokenizerPath);
  const dispose = () => tokenizer.dispose();

  return {
    encode: wrapAsync(tokenizer.encode, runtime),
    decode: wrapAsync(tokenizer.decode, runtime),
    getVocabSize: tokenizer.getVocabSize,
    idToToken: tokenizer.idToToken,
    tokenToId: tokenizer.tokenToId,
    dispose,
  };
}
