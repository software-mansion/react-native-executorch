import { ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { BaseModule } from '../BaseModule';

export class TextEmbeddingsModule extends BaseModule {
  async load(
    model: { modelSource: ResourceSource; tokenizerSource: ResourceSource },
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ): Promise<void> {
    const modelPromise = ResourceFetcher.fetch(
      onDownloadProgressCallback,
      model.modelSource
    );
    const tokenizerPromise = ResourceFetcher.fetch(
      undefined,
      model.tokenizerSource
    );
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
