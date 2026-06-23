import { rnexecutorchJsi } from '../../native/bridge';

declare const tokenizerBrand: unique symbol;

/**
 * A native HuggingFace-compatible tokenizer instance backed by a JSI host
 * object. All methods are synchronous and worklet-compatible.
 * @category Types
 */
export type Tokenizer = {
  /** Absolute local path of the loaded `tokenizer.json`. */
  readonly path: string;

  /**
   * Encodes a string into token ids (special tokens are added according to the
   * tokenizer.json post_processor).
   * @param text The input text to tokenize.
   * @returns The encoded token ids.
   */
  encode(text: string): number[];

  /**
   * Decodes token ids back into a string.
   * @param tokens The token ids to decode.
   * @param skipSpecialTokens Whether to omit special tokens. Defaults to `true`.
   * @returns The decoded text.
   */
  decode(tokens: number[], skipSpecialTokens?: boolean): string;

  /**
   * @returns The size of the tokenizer's vocabulary.
   */
  getVocabSize(): number;

  /**
   * @param id The token id to look up.
   * @returns The token string for the given id.
   */
  idToToken(id: number): string;

  /**
   * @param token The token string to look up.
   * @returns The id for the given token string.
   */
  tokenToId(token: string): number;

  /** Releases the native tokenizer. The instance must not be used afterwards. */
  dispose(): void;

  /**
   * Prevents plain JS objects from being cast as Tokenizers.
   * @internal
   */
  readonly [tokenizerBrand]: never;
};

/**
 * Loads a HuggingFace tokenizer from a local `tokenizer.json` file.
 * @category Typescript API
 * @param tokenizerPath Absolute local path to a `tokenizer.json` file.
 * @returns The loaded tokenizer.
 */
export function loadTokenizer(tokenizerPath: string): Tokenizer {
  'worklet';
  return rnexecutorchJsi.nlp.loadTokenizer(tokenizerPath) as Tokenizer;
}
