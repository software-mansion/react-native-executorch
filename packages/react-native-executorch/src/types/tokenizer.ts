import { RnExecutorchError } from '../errors/errorUtils';
import { ResourceSource } from './common';

/**
 * Parameters for initializing and configuring a Tokenizer instance.
 *
 * @category Types
 */
export interface TokenizerProps {
  /**
   * Object containing:
   *
   * `tokenizerSource` - A `ResourceSource` that specifies the location of the tokenizer.
   */
  tokenizer: { tokenizerSource: ResourceSource };

  /**
   * Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
   */
  preventLoad?: boolean;
}

/**
 * React hook state and methods for managing a Tokenizer instance.
 *
 * @category Types
 */
export interface TokenizerType {
  /**
   * Contains the error message if the tokenizer failed to load or during processing.
   */
  error: null | RnExecutorchError;

  /**
   * Indicates whether the tokenizer has successfully loaded and is ready for use.
   */
  isReady: boolean;

  /**
   * Indicates whether the tokenizer is currently processing data.
   */
  isGenerating: boolean;

  /**
   * Tracks the progress of the tokenizer download process (value between 0 and 1).
   */
  downloadProgress: number;

  /**
   * Converts an array of token IDs into a string.
   * @param tokens - An array or `number[]` of token IDs to decode.
   * @param skipSpecialTokens - Optional boolean to indicate whether special tokens should be skipped during decoding.
   * @returns A promise resolving to the decoded text string.
   */
  decode(
    tokens: number[],
    skipSpecialTokens: boolean | undefined
  ): Promise<string>;

  /**
   * Converts a string into an array of token IDs.
   * @param text - The input text string to tokenize.
   * @returns A promise resolving to an array `number[]` containing the encoded token IDs.
   */
  encode(text: string): Promise<number[]>;

  /**
   * Returns the size of the tokenizer's vocabulary.
   * @returns A promise resolving to the vocabulary size.
   */
  getVocabSize(): Promise<number>;

  /**
   * Returns the token associated to the ID.
   * @param id - The numeric token ID.
   * @returns A promise resolving to the token string representation.
   */
  idToToken(id: number): Promise<string>;

  /**
   * Returns the ID associated to the token.
   * @param token - The token string.
   * @returns A promise resolving to the token ID.
   */
  tokenToId(token: string): Promise<number>;
}
