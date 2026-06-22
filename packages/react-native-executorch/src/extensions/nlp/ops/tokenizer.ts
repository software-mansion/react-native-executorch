import { rnexecutorchJsi } from '../../../native/bridge';

declare const tokenizerBrand: unique symbol;

/**
 * A native HuggingFace-compatible tokenizer instance, backed by a JSI host
 * object living on the worklet runtime it was loaded on.
 *
 * All methods are synchronous and worklet-callable, mirroring the {@link Model}
 * and {@link Tensor} primitives. For app-level usage prefer the asynchronous
 * {@link createTokenizer} factory or the `useTokenizer` hook, which marshal
 * these calls onto the worklet runtime for you.
 * @category Types
 */
export type Tokenizer = {
  readonly path: string;

  /** Encodes a string into an array of token ids (special tokens follow the tokenizer.json post_processor). */
  encode(text: string): number[];
  /** Decodes an array of token ids back into a string. */
  decode(tokens: number[], skipSpecialTokens: boolean): string;
  /** Returns the size of the tokenizer's vocabulary. */
  getVocabSize(): number;
  /** Returns the token string associated with the given id. */
  idToToken(id: number): string;
  /** Returns the id associated with the given token string. */
  tokenToId(token: string): number;
  /** Frees the native tokenizer. The instance must not be used afterwards. */
  dispose(): void;

  /**
   * Prevents plain JS objects from being cast as Tokenizers. Tokenizers should
   * only be created via the `loadTokenizer` function exported from this module.
   * @internal
   */
  readonly [tokenizerBrand]: never;
};

/**
 * Loads a HuggingFace tokenizer from a local `tokenizer.json` file.
 *
 * This is a worklet-compatible primitive — it must be invoked on the worklet
 * runtime (e.g. via {@link wrapAsync}) and returns a {@link Tokenizer} host
 * object bound to that runtime.
 * @category Typescript API
 * @param tokenizerPath Absolute local path to a `tokenizer.json` file.
 * @returns The loaded tokenizer.
 */
export function loadTokenizer(tokenizerPath: string): Tokenizer {
  'worklet';
  return rnexecutorchJsi.loadTokenizer(tokenizerPath) as Tokenizer;
}
