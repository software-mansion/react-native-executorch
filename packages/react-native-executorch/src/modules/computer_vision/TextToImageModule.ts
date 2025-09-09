import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { BaseModule } from '../BaseModule';

export class TextToImageModule extends BaseModule {
  private downloadProgress = 0;
  private readonly numComponents = 4;

  async load(
    model: {
      tokenizerSource: ResourceSource;
      schedulerSource: ResourceSource;
      encoderSource: ResourceSource;
      unetSource: ResourceSource;
      decoderSource: ResourceSource;
      imageSize: number;
    },
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ): Promise<void> {
    const onTotalDownloadProgressCallback = (progress: number) => {
      this.downloadProgress += progress;
      onDownloadProgressCallback(
        this.downloadProgress / (100 * this.numComponents)
      );
    };

    const tokenizerPromise = ResourceFetcher.fetch(
      undefined,
      model.tokenizerSource
    );
    const schedulerPromise = ResourceFetcher.fetch(
      onTotalDownloadProgressCallback,
      model.schedulerSource
    );
    const encoderPromise = ResourceFetcher.fetch(
      onTotalDownloadProgressCallback,
      model.encoderSource
    );
    const unetPromise = ResourceFetcher.fetch(
      onTotalDownloadProgressCallback,
      model.unetSource
    );
    const decoderPromise = ResourceFetcher.fetch(
      onTotalDownloadProgressCallback,
      model.decoderSource
    );
    const [
      tokenizerResult,
      schedulerResult,
      encoderResult,
      unetResult,
      decoderResult,
    ] = await Promise.all([
      tokenizerPromise,
      schedulerPromise,
      encoderPromise,
      unetPromise,
      decoderPromise,
    ]);
    const tokenizerPath = tokenizerResult?.[0];
    const schedulerPath = schedulerResult?.[0];
    const encoderPath = encoderResult?.[0];
    const unetPath = unetResult?.[0];
    const decoderPath = decoderResult?.[0];
    if (
      !tokenizerPath ||
      !schedulerPath ||
      !encoderPath ||
      !unetPath ||
      !decoderPath
    ) {
      throw new Error('Download interrupted.');
    }

    const response = await fetch('file://' + schedulerPath);
    const schedulerConfig = await response.json();

    this.nativeModule = global.loadTextToImage(
      tokenizerPath,
      schedulerConfig.beta_start,
      schedulerConfig.beta_end,
      schedulerConfig.num_train_timesteps,
      schedulerConfig.steps_offset,
      encoderPath,
      unetPath,
      decoderPath,
      model.imageSize
    );
  }

  async forward(input: string, numSteps: number): Promise<Float32Array> {
    return new Float32Array(await this.nativeModule.generate(input, numSteps));
  }
}
