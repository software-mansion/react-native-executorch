import { ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';

export class TokenizerModule {
  nativeModule: any;

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
      throw new Error('Download interrupted.');
    }
    this.nativeModule = global.loadTokenizerModule(path);
  }

  async encode(s: string) {
    return await this.nativeModule.encode(s);
  }

  async decode(tokens: number[], skipSpecialTokens: boolean = true) {
    if (tokens.length === 0) {
      return '';
    }
    return await this.nativeModule.decode(tokens, skipSpecialTokens);
  }

  async getVocabSize(): Promise<number> {
    return await this.nativeModule.getVocabSize();
  }

  async idToToken(tokenId: number): Promise<string> {
    return this.nativeModule.idToToken(tokenId);
  }

  async tokenToId(token: string): Promise<number> {
    return await this.nativeModule.tokenToId(token);
  }
}
