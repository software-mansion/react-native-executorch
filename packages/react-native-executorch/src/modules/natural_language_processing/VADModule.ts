import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { Segment, VADModelName } from '../../types/vad';
import { BaseModule } from '../BaseModule';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { Logger } from '../../common/Logger';

/**
 * Module for Voice Activity Detection (VAD) functionalities.
 * @category Typescript API
 */
export class VADModule extends BaseModule {
  private constructor(nativeModule: unknown) {
    super();
    this.nativeModule = nativeModule;
  }

  /**
   * Creates a VAD instance for a built-in model.
   * @param namedSources - An object specifying which built-in model to load and where to fetch it from.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `VADModule` instance.
   */
  static async fromModelName(
    namedSources: { modelName: VADModelName; modelSource: ResourceSource },
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<VADModule> {
    try {
      const paths = await ResourceFetcher.fetch(
        onDownloadProgress,
        namedSources.modelSource
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
   * Creates a VAD instance with a user-provided model binary.
   * Use this when working with a custom-exported model that is not one of the built-in presets.
   * @remarks The native model contract for this method is not formally defined and may change
   * between releases. Refer to the native source code for the current expected tensor interface.
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `VADModule` instance.
   */
  static fromCustomModel(
    modelSource: ResourceSource,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<VADModule> {
    return VADModule.fromModelName(
      { modelName: 'custom' as VADModelName, modelSource },
      onDownloadProgress
    );
  }

  /**
   * Executes the model's forward pass to detect speech segments within the provided audio.
   * @param waveform - A `Float32Array` representing a mono audio signal sampled at 16kHz.
   * @returns A Promise resolving to an array of {@link Segment} objects.
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
