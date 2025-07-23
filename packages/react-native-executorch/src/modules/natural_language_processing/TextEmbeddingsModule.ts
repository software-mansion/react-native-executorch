import { ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { BaseNonStaticModule } from '../BaseNonStaticModule';

export class TextEmbeddingsModule extends BaseNonStaticModule {
  async load(
    modelSource: ResourceSource,
    tokenizerSource: ResourceSource,
    onDownloadProgressCallback: (_: number) => void = () => {}
  ): Promise<void> {
    const modelPromise = ResourceFetcher.fetch(
      onDownloadProgressCallback,
      modelSource
    );
    const tokenizerPromise = ResourceFetcher.fetch(undefined, tokenizerSource);
    const [modelResult, tokenizerResult] = await Promise.all([
      modelPromise,
      tokenizerPromise,
    ]);
    const modelPath = modelResult?.[0];
    const tokenizerPath = tokenizerResult?.[0];
    if (!modelPath || !tokenizerPath) {
      throw new Error('Download interrupted.');
    }
    this.nativeModule = global.loadTextEmbeddings(modelPath, tokenizerPath);
  }

  async forward(input: string): Promise<Float32Array> {
    return new Float32Array(await this.nativeModule.generate(input));
  }
}
