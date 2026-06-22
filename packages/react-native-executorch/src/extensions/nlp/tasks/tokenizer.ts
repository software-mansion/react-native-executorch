import type { WorkletRuntime } from 'react-native-worklets';

import { wrapAsync } from '../../../core/runtime';
import { loadTokenizer } from '../ops/tokenizer';

/**
 * Model configuration required to instantiate a tokenizer task runner.
 * @category Types
 */
export type TokenizerConfig = {
  readonly tokenizerPath: string;
};

/**
 * Creates a tokenizer runner around a local `tokenizer.json` file.
 *
 * The native tokenizer is loaded on the provided worklet runtime. Each exposed
 * method comes in two flavours: an asynchronous variant (default) that marshals
 * the call onto the worklet runtime, and a `*Worklet` variant for synchronous
 * use inside other worklets (e.g. when composing a text-embeddings pipeline).
 * @category Typescript API
 * @param config Tokenizer configuration containing the local path.
 * @param runtime Optional worklet runtime thread on which to run the tokenizer.
 * @returns A promise resolving to an object containing tokenization and disposal
 * controls.
 */
export async function createTokenizer(config: TokenizerConfig, runtime?: WorkletRuntime) {
  const { tokenizerPath } = config;
  const tokenizer = await wrapAsync(loadTokenizer, runtime)(tokenizerPath);

  const encodeWorklet = (text: string): number[] => {
    'worklet';
    return tokenizer.encode(text);
  };

  const decodeWorklet = (tokens: number[], skipSpecialTokens: boolean = true): string => {
    'worklet';
    if (tokens.length === 0) {
      return '';
    }
    return tokenizer.decode(tokens, skipSpecialTokens);
  };

  const getVocabSizeWorklet = (): number => {
    'worklet';
    return tokenizer.getVocabSize();
  };

  const idToTokenWorklet = (id: number): string => {
    'worklet';
    return tokenizer.idToToken(id);
  };

  const tokenToIdWorklet = (token: string): number => {
    'worklet';
    return tokenizer.tokenToId(token);
  };

  const dispose = () => tokenizer.dispose();

  return {
    encode: wrapAsync(encodeWorklet, runtime),
    decode: wrapAsync(decodeWorklet, runtime),
    getVocabSize: wrapAsync(getVocabSizeWorklet, runtime),
    idToToken: wrapAsync(idToTokenWorklet, runtime),
    tokenToId: wrapAsync(tokenToIdWorklet, runtime),
    encodeWorklet,
    decodeWorklet,
    getVocabSizeWorklet,
    idToTokenWorklet,
    tokenToIdWorklet,
    dispose,
  };
}
