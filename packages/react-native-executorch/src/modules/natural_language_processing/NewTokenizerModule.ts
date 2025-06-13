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
    console.log(paths);
    this.nativeModule = global.loadTokenizerModule(paths[0] || '');
  }

  async encode(s: string) {
    return await this.nativeModule.encode(s);
  }

  async decode(tokens: number[]) {
    return await this.nativeModule.decode(tokens);
  }
}
