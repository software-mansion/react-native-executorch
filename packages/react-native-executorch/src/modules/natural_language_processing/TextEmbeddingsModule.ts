import { ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { BaseNonStaticModule } from '../BaseNonStaticModule';

export class TextEmbeddingsModule extends BaseNonStaticModule {
  async load(
    modelSource: ResourceSource,
    tokenizerSource: ResourceSource,
    onDownloadProgressCallback: (_: number) => void = () => {}
  ): Promise<void> {
    const paths = await ResourceFetcher.fetch(
      onDownloadProgressCallback,
      modelSource,
      tokenizerSource
    );
    if (paths === null || paths.length < 2) {
      throw new Error('Download interrupted.');
    }
    this.nativeModule = global.loadTextEmbeddings(
      paths[0] || '',
      paths[1] || ''
    );
  }

  async forward(input: string): Promise<Float32Array> {
    return new Float32Array(await this.nativeModule.generate(input));
  }
}
