import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { BaseModule } from '../BaseModule';
import { Buffer } from 'buffer';
import { PNG } from 'pngjs/browser';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError } from '../../errors/errorUtils';

/**
 * Module for text-to-image generation tasks.
 *
 * @category Typescript API
 */
export class TextToImageModule extends BaseModule {
  private inferenceCallback: (stepIdx: number) => void;

  /**
   * Creates a new instance of `TextToImageModule` with optional callback on inference step.
   *
   * @param inferenceCallback - Optional callback function that receives the current step index during inference.
   */
  constructor(inferenceCallback?: (stepIdx: number) => void) {
    super();
    this.inferenceCallback = (stepIdx: number) => {
      inferenceCallback?.(stepIdx);
    };
  }

  /**
   * Loads the model from specified resources.
   *
   * @param model - Object containing sources for tokenizer, scheduler, encoder, unet, and decoder.
   * @param onDownloadProgressCallback - Optional callback to monitor download progress.
   */
  async load(
    model: {
      tokenizerSource: ResourceSource;
      schedulerSource: ResourceSource;
      encoderSource: ResourceSource;
      unetSource: ResourceSource;
      decoderSource: ResourceSource;
    },
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ): Promise<void> {
    try {
      const results = await ResourceFetcher.fetch(
        onDownloadProgressCallback,
        model.tokenizerSource,
        model.schedulerSource,
        model.encoderSource,
        model.unetSource,
        model.decoderSource
      );
      if (!results) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.DownloadInterrupted,
          'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
        );
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
        throw new RnExecutorchError(
          RnExecutorchErrorCode.DownloadInterrupted,
          'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
        );
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
        schedulerConfig.steps_offset
      );
    } catch (error) {
      console.error('Load Failed:', error);
      throw error;
    }
  }

  /**
   * Runs the model to generate an image described by `input`, and conditioned by `seed`, performing `numSteps` inference steps.
   * The resulting image, with dimensions `imageSize`×`imageSize` pixels, is returned as a base64-encoded string.
   *
   * @param input - The text prompt to generate the image from.
   * @param imageSize - The desired width and height of the output image in pixels.
   * @param numSteps - The number of inference steps to perform.
   * @param seed - An optional seed for random number generation to ensure reproducibility.
   * @returns A Base64-encoded string representing the generated PNG image.
   */
  async forward(
    input: string,
    imageSize: number = 512,
    numSteps: number = 5,
    seed?: number
  ): Promise<string> {
    const output = await this.nativeModule.generate(
      input,
      imageSize,
      numSteps,
      seed ? seed : -1,
      this.inferenceCallback
    );
    const outputArray = new Uint8Array(output);
    if (!outputArray.length) {
      return '';
    }
    const png = new PNG({ width: imageSize, height: imageSize });
    png.data = Buffer.from(outputArray);
    const pngBuffer = PNG.sync.write(png, { colorType: 6 });
    const pngString = pngBuffer.toString('base64');
    return pngString;
  }

  /**
   * Interrupts model generation. The model is stopped in the nearest step.
   */
  public interrupt(): void {
    this.nativeModule.interrupt();
  }
}
