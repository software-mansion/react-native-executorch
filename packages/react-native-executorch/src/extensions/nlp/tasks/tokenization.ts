/**
 * Tokenization task pipeline wrapping native HuggingFace tokenizers.
 * @module NLP/Tasks/Tokenization
 */

import type { WorkletRuntime } from 'react-native-worklets';

import { wrapAsync } from '../../../core/runtime';
import { loadTokenizer } from '../tokenizer';

/**
 * Asynchronous tokenizer task runner wrapping native HuggingFace tokenizer operations.
 * @category NLP / Types
 */
export type Tokenizer = {
  /** Encodes a string into token ids asynchronously. */
  readonly encode: (text: string) => Promise<Int32Array>;
  /** Decodes token ids back into a string asynchronously. */
  readonly decode: (tokens: Int32Array, skipSpecialTokens?: boolean) => Promise<string>;
  /** Returns the total vocabulary size. */
  readonly getVocabSize: () => number;
  /** Converts a numeric token id to its string piece representation. */
  readonly idToToken: (id: number) => string;
  /** Converts a string piece token to its numeric token id. */
  readonly tokenToId: (token: string) => number;
  /** Releases the native tokenizer resources. */
  readonly dispose: () => void;
};

/**
 * Loads a tokenizer and exposes its operations with lifetime management for the
 * `useTokenizer` hook.
 * @category NLP / Tasks
 * @param tokenizerPath Absolute local path to a `tokenizer.json` file.
 * @param runtime Optional worklet runtime thread to run the tokenizer on.
 * @returns A promise resolving to the tokenizer operations and a `dispose`
 * handle that releases the native tokenizer.
 */
export async function createTokenizer(
  tokenizerPath: string,
  runtime?: WorkletRuntime
): Promise<Tokenizer> {
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
