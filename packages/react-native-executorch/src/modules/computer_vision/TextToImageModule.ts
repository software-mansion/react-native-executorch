import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { TextToImageModelName } from '../../types/tti';
import { BaseModule } from '../BaseModule';

import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { Logger } from '../../common/Logger';

/**
 * Module for text-to-image generation tasks.
 * @category Typescript API
 */
export class TextToImageModule extends BaseModule {
  private inferenceCallback: (stepIdx: number) => void;

  private constructor(
    nativeModule: unknown,
    inferenceCallback?: (stepIdx: number) => void
  ) {
    super();
    this.nativeModule = nativeModule;
    this.inferenceCallback = (stepIdx: number) => {
      inferenceCallback?.(stepIdx);
    };
  }

  /**
   * Creates a Text to Image instance for a built-in model.
   * @param namedSources - An object specifying the model name, pipeline sources, and optional inference callback.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `TextToImageModule` instance.
   * @example
   * ```ts
   * import { TextToImageModule, BK_SDM_TINY_VPRED_512 } from 'react-native-executorch';
   * const tti = await TextToImageModule.fromModelName(BK_SDM_TINY_VPRED_512);
   * ```
   */
  static async fromModelName(
    namedSources: {
      modelName: TextToImageModelName;
      tokenizerSource: ResourceSource;
      schedulerSource: ResourceSource;
      encoderSource: ResourceSource;
      unetSource: ResourceSource;
      decoderSource: ResourceSource;
      inferenceCallback?: (stepIdx: number) => void;
    },
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<TextToImageModule> {
    try {
      const nativeModule = await TextToImageModule.load(
        namedSources,
        onDownloadProgress
      );
      return new TextToImageModule(
        nativeModule,
        namedSources.inferenceCallback
      );
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Creates a Text to Image instance with user-provided model binaries.
   * Use this when working with a custom-exported diffusion pipeline.
   * Internally uses `'custom'` as the model name for telemetry.
   * @remarks The native model contract for this method is not formally defined and may change
   * between releases. Refer to the native source code for the current expected tensor interface.
   * @param sources - An object containing the pipeline source paths.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @param inferenceCallback - Optional callback triggered after each diffusion step.
   * @returns A Promise resolving to a `TextToImageModule` instance.
   */
  static fromCustomModel(
    sources: {
      tokenizerSource: ResourceSource;
      schedulerSource: ResourceSource;
      encoderSource: ResourceSource;
      unetSource: ResourceSource;
      decoderSource: ResourceSource;
    },
    onDownloadProgress: (progress: number) => void = () => {},
    inferenceCallback?: (stepIdx: number) => void
  ): Promise<TextToImageModule> {
    return TextToImageModule.fromModelName(
      {
        modelName: 'custom' as TextToImageModelName,
        ...sources,
        inferenceCallback,
      },
      onDownloadProgress
    );
  }

  private static async load(
    model: {
      tokenizerSource: ResourceSource;
      schedulerSource: ResourceSource;
      encoderSource: ResourceSource;
      unetSource: ResourceSource;
      decoderSource: ResourceSource;
    },
    onDownloadProgressCallback: (progress: number) => void
  ): Promise<unknown> {
    const results = await ResourceFetcher.fetch(
      onDownloadProgressCallback,
      model.tokenizerSource,
      model.schedulerSource,
      model.encoderSource,
      model.unetSource,
      model.decoderSource
    );
    if (!results || results.length !== 5) {
      throw new RnExecutorchError(RnExecutorchErrorCode.DownloadInterrupted);
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
      throw new RnExecutorchError(RnExecutorchErrorCode.DownloadInterrupted);
    }

    const schedulerJson = await ResourceFetcher.fs.readAsString(schedulerPath);
    const schedulerConfig = JSON.parse(schedulerJson);

    return global.loadTextToImage(
      tokenizerPath,
      encoderPath,
      unetPath,
      decoderPath,
      schedulerConfig.beta_start,
      schedulerConfig.beta_end,
      schedulerConfig.num_train_timesteps,
      schedulerConfig.steps_offset
    );
  }

  /**
   * Runs the model to generate an image described by `input`, and conditioned by `seed`, performing `numSteps` inference steps.
   * The resulting image, with dimensions `imageSize`×`imageSize` pixels, is saved as a PNG on the device and returned as a `file://` URI.
   * If generation is interrupted before completion, an empty string is returned.
   * @param input - The text prompt to generate the image from.
   * @param imageSize - The desired width and height of the output image in pixels.
   * @param numSteps - The number of inference steps to perform.
   * @param seed - An optional seed for random number generation to ensure reproducibility.
   * @returns A `file://` URI pointing to the generated PNG, or an empty string if generation was interrupted.
   */
  async forward(
    input: string,
    imageSize: number = 512,
    numSteps: number = 5,
    seed?: number
  ): Promise<string> {
    return await this.nativeModule.generate(
      input,
      imageSize,
      numSteps,
      seed ? seed : -1,
      this.inferenceCallback
    );
  }

  /**
   * Interrupts model generation. The model is stopped in the nearest step.
   */
  public interrupt(): void {
    this.nativeModule.interrupt();
  }
}
