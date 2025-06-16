import { ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';

export class NewTokenizerModule {
  nativeModule: any;

  async load(
    modelSource: ResourceSource,
    onDownloadProgressCallback: (_: number) => void = () => {}
  ): Promise<void> {
    const paths = await ResourceFetcher.fetchMultipleResources(
      onDownloadProgressCallback,
      modelSource
    );
    this.nativeModule = global.loadTokenizerModule(paths[0] || '');
  }

  async encode(s: string) {
    return await this.nativeModule.encode(s);
  }

  async decode(tokens: number[], skipSpecialTokens: boolean = true) {
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
