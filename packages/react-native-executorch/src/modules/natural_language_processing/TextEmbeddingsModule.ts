import { ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { BaseModule } from '../BaseModule';
import { ETErrorCode } from '../../errors/ErrorCodes';
import { ExecutorchError } from '../../errors/errorUtils';

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
      throw new ExecutorchError(
        ETErrorCode.DownloadInterrupted,
        'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
      );
    }
    this.nativeModule = global.loadTextEmbeddings(modelPath, tokenizerPath);
  }

  async forward(input: string): Promise<Float32Array> {
    return new Float32Array(await this.nativeModule.generate(input));
  }
}
