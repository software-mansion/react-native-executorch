import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { BaseModule } from '../BaseModule';
import { Buffer } from 'buffer';
import { PNG } from 'pngjs/browser';

export class TextToImageModule extends BaseModule {
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

    const results = await ResourceFetcher.fetch(
      onDownloadProgressCallback,
      model.tokenizerSource,
      model.schedulerSource,
      model.encoderSource,
      model.unetSource,
      model.decoderSource
    );
    if (!results) {
      throw new Error('Failed to fetch one or more resources.');
    }
    const [tokenizerPath, schedulerPath, encoderPath, unetPath, decoderPath] =
      results;

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
      encoderPath,
      unetPath,
      decoderPath,
      schedulerConfig.beta_start,
      schedulerConfig.beta_end,
      schedulerConfig.num_train_timesteps,
      schedulerConfig.steps_offset,
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
