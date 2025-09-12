import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { BaseModule } from '../BaseModule';
import { Buffer } from 'buffer';
import { PNG } from 'pngjs/browser';

export class TextToImageModule extends BaseModule {
  private downloadProgress = 0;
  private readonly numComponents = 4;
  private imageSize = 512;
  private inferenceCallback: (stepIdx: number) => void;

  constructor(inferenceCallback?: (stepIdx: number) => void) {
    super();
    this.inferenceCallback = (stepIdx: number) => {
      inferenceCallback?.(stepIdx);
    };
  }

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
    this.imageSize = model.imageSize;
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

  async forward(input: string, numSteps: number = 5): Promise<string> {
    const output = await this.nativeModule.generate(
      input,
      numSteps,
      this.inferenceCallback
    );
    const outputArray = new Uint8Array(output);
    const png = new PNG({ width: this.imageSize, height: this.imageSize });
    png.data = Buffer.from(outputArray);
    const pngBuffer = PNG.sync.write(png, { colorType: 6 });
    const pngString = pngBuffer.toString('base64');
    return pngString;
  }

  public interrupt(): void {
    this.nativeModule.interrupt();
  }
}
