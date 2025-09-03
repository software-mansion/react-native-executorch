import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { BaseModule } from '../BaseModule';

export class TextToImageModule extends BaseModule {
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
    const tokenizerPromise = ResourceFetcher.fetch(
      undefined,
      model.tokenizerSource
    );
    const schedulerPromise = ResourceFetcher.fetch(
      onDownloadProgressCallback,
      model.schedulerSource
    );
    const encoderPromise = ResourceFetcher.fetch(
      onDownloadProgressCallback,
      model.encoderSource
    );
    const unetPromise = ResourceFetcher.fetch(
      onDownloadProgressCallback,
      model.unetSource
    );
    const decoderPromise = ResourceFetcher.fetch(
      onDownloadProgressCallback,
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
    this.nativeModule = global.loadTextToImage(
      tokenizerPath,
      schedulerPath,
      encoderPath,
      unetPath,
      decoderPath,
      model.imageSize
    );
  }

  async forward(input: string, numSteps: number): Promise<Float32Array> {
    console.log('Input:', input);
    const output = await this.nativeModule.generate(input, numSteps);
    console.log('Output:', output);
    return new Float32Array();
    // return new Float32Array(await this.nativeModule.generate(input));
  }
}
