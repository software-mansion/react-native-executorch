import { unicodeToBytes } from '../utils/tokenizerUtils';

export class TokenDecoder {
  private vocab: any;
  private charDecoder;
  private textDecoder;

  constructor(vocab: any) {
    this.vocab = vocab;
    this.charDecoder = unicodeToBytes();
    this.textDecoder = new TextDecoder('utf-8', { fatal: false });
  }

  public tokenIdsToTokens(tokenIds: number[]) {
    return tokenIds.map((token) => this.vocab[token]);
  }

  public tokenIdtoToken(tokenId: number) {
    return this.vocab[tokenId];
  }

  public tokensToDecodedText(tokens: string[]) {
    const stringifiedTokens = tokens.join('');
    const byteArray = Array.from(stringifiedTokens).map(
      (char) => this.charDecoder[char]
    );
    const text = this.textDecoder.decode(
      new Uint8Array(byteArray as number[]),
      { stream: false }
    );
    return text;
  }
}
