/**
 * Native HuggingFace fast tokenizer bindings.
 */

import { rnexecutorchJsi } from '../../native/bridge';

declare const tokenizerBrand: unique symbol;

/**
 * A native HuggingFace-compatible tokenizer instance backed by a JSI host
 * object. All methods are synchronous and worklet-compatible.
 * @category NLP / Types
 */
export type Tokenizer = {
  /** Absolute local file path of the loaded `tokenizer.json`. */
  readonly path: string;

  /**
   * Encodes a string into token ids (special tokens are added according to the
   * `tokenizer.json` post_processor).
   * @param text The input text string to tokenize.
   * @returns The encoded token ids as an `Int32Array`.
   * @throws {RnExecuTorchError} With code `EXECUTION_FAILED` if tokenization
   * fails, `RESOURCE_BUSY` if the tokenizer is in use, or `RESOURCE_DISPOSED`
   * if disposed.
   */
  encode(text: string): Int32Array;

  /**
   * Decodes token ids back into a string.
   * @param tokens The token ids to decode (as an `Int32Array`).
   * @param skipSpecialTokens Whether to omit special tokens. Defaults to `true`.
   * @returns The decoded text string.
   * @throws {RnExecuTorchError} With code `EXECUTION_FAILED` if decoding fails,
   * `RESOURCE_BUSY` if the tokenizer is in use, or `RESOURCE_DISPOSED` if
   * disposed.
   */
  decode(tokens: Int32Array, skipSpecialTokens?: boolean): string;

  /**
   * Returns the total vocabulary size.
   * @returns The total number of tokens in the vocabulary.
   * @throws {RnExecuTorchError} With code `RESOURCE_BUSY` if the tokenizer is
   * in use, or `RESOURCE_DISPOSED` if disposed.
   */
  getVocabSize(): number;

  /**
   * Converts a numeric token id to its string piece representation.
   * @param id The token id to look up.
   * @returns The string piece for the given token id.
   * @throws {RnExecuTorchError} With code `EXECUTION_FAILED` if id lookup
   * fails, `RESOURCE_BUSY` if the tokenizer is in use, or `RESOURCE_DISPOSED`
   * if disposed.
   */
  idToToken(id: number): string;

  /**
   * Converts a string piece token to its numeric token id.
   * @param token The token piece string to look up.
   * @returns The numeric id for the given token piece.
   * @throws {RnExecuTorchError} With code `EXECUTION_FAILED` if token lookup
   * fails, `RESOURCE_BUSY` if the tokenizer is in use, or `RESOURCE_DISPOSED`
   * if disposed.
   */
  tokenToId(token: string): number;

  /**
   * Releases the native tokenizer resources. The instance must not be used
   * afterwards.
   * @throws {RnExecuTorchError} With code `RESOURCE_DISPOSED` if the tokenizer
   * has already been disposed.
   */
  dispose(): void;

  /**
   * Prevents plain JS objects from being cast as Tokenizers.
   * @internal
   */
  readonly [tokenizerBrand]: never;
};

/**
 * Loads a HuggingFace tokenizer from a local `tokenizer.json` file.
 * @category NLP / Functions
 * @param tokenizerPath Absolute local path to a `tokenizer.json` file.
 * @returns The loaded native {@link Tokenizer} instance.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if the tokenizer file
 * fails to load or parse.
 */
export function loadTokenizer(tokenizerPath: string): Tokenizer {
  'worklet';
  return rnexecutorchJsi.nlp.loadTokenizer(tokenizerPath) as Tokenizer;
}
