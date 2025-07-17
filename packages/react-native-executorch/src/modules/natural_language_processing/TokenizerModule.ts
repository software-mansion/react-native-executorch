import { ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';

export class TokenizerModule {
  nativeModule: any;

  async load(
    modelSource: ResourceSource,
    onDownloadProgressCallback: (_: number) => void = () => {}
  ): Promise<void> {
    const paths = await ResourceFetcher.fetch(
      onDownloadProgressCallback,
      modelSource
    );
    if (paths === null || paths.length < 1) {
      throw new Error('Download interrupted.');
    }
    this.nativeModule = global.loadTokenizerModule(paths[0] || '');
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
