import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { Segment } from '../../types/vad';
import { BaseModule } from '../BaseModule';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { Logger } from '../../common/Logger';

/**
 * Module for Voice Activity Detection (VAD) functionalities.
 *
 * @category Typescript API
 */
export class VADModule extends BaseModule {
  private constructor(nativeModule: unknown) {
    super();
    this.nativeModule = nativeModule;
  }

  /**
   * Creates a `VADModule` instance and loads the model.
   *
   * @param model - Object containing `modelSource`.
   * @param onDownloadProgress - Optional callback to monitor download progress (value between 0 and 1).
   * @returns A Promise resolving to a ready-to-use `VADModule` instance.
   */
  static async fromModelName(
    model: { modelSource: ResourceSource },
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<VADModule> {
    try {
      const paths = await ResourceFetcher.fetch(
        onDownloadProgress,
        model.modelSource
      );
      if (!paths?.[0]) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.DownloadInterrupted,
          'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
        );
      }
      return new VADModule(await global.loadVAD(paths[0]));
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Executes the model's forward pass, where `waveform` is a Float32Array representing the audio signal (16kHz).
   *
   * @param waveform - The input audio waveform as a Float32Array. It must represent a mono audio signal sampled at 16kHz.
   * @returns A promise resolving to an array of detected speech segments.
   */
  async forward(waveform: Float32Array): Promise<Segment[]> {
    if (this.nativeModule == null)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    return await this.nativeModule.generate(waveform);
  }
}
