import * as FileSystem from 'expo-file-system';
import { ResourceSource } from '../types/common';
import { fetchResource } from '../utils/fetchResource';
import { unicodeToBytes } from '../utils/tokenizerUtils';

/**
 * TokenDecoder class responsible for decoding token IDs into tokens and converting tokens into text.
 */
export class TokenDecoder {
  private vocab: any;
  private unicodeToBytes;
  private textDecoder;

  constructor() {
    this.unicodeToBytes = unicodeToBytes();
    this.textDecoder = new TextDecoder('utf-8', { fatal: false });
  }

  /**
   * Fetches the vocabulary of the tokenizer which can later be used for mapping tokenIds to tokens.
   * @param {ResourceSource} source - URL to the tokenizer vocab to fetch.
   * @returns {Promise<{ [key: number]: string }>} - A mapping of with tokenId as key and token as value.
   */
  public async setVocabFromResource(source: ResourceSource): Promise<void> {
    if (typeof source === 'object') {
      // When using require(), we might get a parsed JS object in return.
      // This means that we don't need to to anything else
      this.vocab = source;
    } else {
      try {
        let tokenzerUri = await fetchResource(source);
        this.vocab = JSON.parse(
          await FileSystem.readAsStringAsync(tokenzerUri)
        );
      } catch (e) {
        throw new Error(
          'An error occurred while fetching or parsing the tokenizer: ' +
            (e as Error).message
        );
      }
    }
  }

  /**
   * Converts an array of token IDs into their corresponding token strings.
   * @param {number[]} tokenIds - An array of token IDs.
   * @returns {string[]} An array of token strings.
   */
  public tokenIdsToTokens(tokenIds: number[]): string[] {
    return tokenIds.map((token) => this.vocab[token]);
  }

  /**
   * Converts a single token ID into its corresponding token string.
   * @param {number} tokenId - A single token ID.
   * @returns {string} The corresponding token string.
   */
  public tokenIdtoToken(tokenId: number): string {
    return this.vocab[tokenId];
  }

  /**
   * Decodes an array of tokens into a readable text string.
   * @param {string[]} tokens - An array of token strings.
   * @returns {string} The decoded text.
   */
  public tokensToDecodedText(tokens: string[]): string {
    const stringifiedTokens = tokens.join('');
    const byteArray = Array.from(stringifiedTokens).map(
      (char) => this.unicodeToBytes[char]
    );
    const text = this.textDecoder.decode(
      new Uint8Array(byteArray as number[]),
      { stream: false }
    );
    return text;
  }
}
