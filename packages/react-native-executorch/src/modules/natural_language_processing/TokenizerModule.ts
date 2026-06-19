import { ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { Logger } from '../../common/Logger';
import { BaseModule } from '../BaseModule';

/**
 * Module for Tokenizer functionalities.
 * @category Typescript API
 */
export class TokenizerModule extends BaseModule {
  private constructor(nativeModule: unknown) {
    super();
    this.nativeModule = nativeModule;
  }

  /**
   * Creates a Tokenizer instance for the provided tokenizer JSON source.
   * @param namedSources - Object containing `tokenizerSource` — a fetchable resource pointing at the tokenizer JSON.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `TokenizerModule` instance.
   */
  static async fromModelName(
    namedSources: { tokenizerSource: ResourceSource },
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<TokenizerModule> {
    try {
      const paths = await ResourceFetcher.fetch(
        onDownloadProgress,
        namedSources.tokenizerSource
      );
      const path = paths?.[0];
      if (!path) {
        throw new RnExecutorchError(RnExecutorchErrorCode.DownloadInterrupted);
      }
      const nativeModule = await global.loadTokenizerModule(path);
      return new TokenizerModule(nativeModule);
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Converts a string into an array of token IDs.
   * @param input - The input string to be tokenized.
   * @returns An array of token IDs.
   */
  async encode(input: string): Promise<number[]> {
    return await this.nativeModule.encode(input);
  }

  /**
   * Converts an array of token IDs into a string.
   * @param tokens - Array of token IDs to be decoded.
   * @param skipSpecialTokens - Whether to skip special tokens during decoding (default: true).
   * @returns The decoded string.
   */
  async decode(
    tokens: number[],
    skipSpecialTokens: boolean = true
  ): Promise<string> {
    if (tokens.length === 0) {
      return '';
    }
    return await this.nativeModule.decode(tokens, skipSpecialTokens);
  }

  /**
   * Returns the size of the tokenizer's vocabulary.
   * @returns The vocabulary size.
   */
  async getVocabSize(): Promise<number> {
    return await this.nativeModule.getVocabSize();
  }

  /**
   * Returns the token associated to the ID.
   * @param tokenId - ID of the token.
   * @returns The token string associated to ID.
   */
  async idToToken(tokenId: number): Promise<string> {
    return this.nativeModule.idToToken(tokenId);
  }

  /**
   * Returns the ID associated to the token.
   * @param token - The token string.
   * @returns The ID associated to the token.
   */
  async tokenToId(token: string): Promise<number> {
    return await this.nativeModule.tokenToId(token);
  }
}
