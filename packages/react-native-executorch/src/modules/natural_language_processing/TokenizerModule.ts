import { ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { RnExecutorchError } from '../../errors/errorUtils';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';

export class TokenizerModule {
  /**
   * Native module instance
   */
  nativeModule: any;

  /**
   * Loads the tokenizer from the specified source. 
   * `tokenizerSource` is a string that points to the location of the tokenizer JSON file.
   * 
   * @param tokenizer - Object containing `tokenizerSource`.
   * @param onDownloadProgressCallback - Optional callback to monitor download progress.
   */
  async load(
    tokenizer: { tokenizerSource: ResourceSource },
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ): Promise<void> {
    const paths = await ResourceFetcher.fetch(
      onDownloadProgressCallback,
      tokenizer.tokenizerSource
    );
    const path = paths?.[0];
    if (!path) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
      );
    }
    this.nativeModule = global.loadTokenizerModule(path);
  }

  /**
   * Converts a string into an array of token IDs.
   * 
   * @param input - The input string to be tokenized.
   * @returns An array of token IDs.
   */
  async encode(input: string) {
    return await this.nativeModule.encode(input);
  }

  /**
   * Converts an array of token IDs into a string.
   * 
   * @param tokens - Array of token IDs to be decoded.
   * @param skipSpecialTokens - Whether to skip special tokens during decoding (default: true).
   * @returns The decoded string.
  */
  async decode(tokens: number[], skipSpecialTokens: boolean = true) {
    if (tokens.length === 0) {
      return '';
    }
    return await this.nativeModule.decode(tokens, skipSpecialTokens);
  }

  /**
   * Returns the size of the tokenizer's vocabulary.
   * 
   * @returns The vocabulary size.
   */
  async getVocabSize(): Promise<number> {
    return await this.nativeModule.getVocabSize();
  }

  /**
   * Returns the token associated to the ID.
   * 
   * @param tokenId - ID of the token.
   * @returns The token string associated to ID.
   */
  async idToToken(tokenId: number): Promise<string> {
    return this.nativeModule.idToToken(tokenId);
  }

  /**
   * Returns the ID associated to the token.
   * 
   * @param token - The token string.
   * @returns The ID associated to the token.
   */
  async tokenToId(token: string): Promise<number> {
    return await this.nativeModule.tokenToId(token);
  }
}
