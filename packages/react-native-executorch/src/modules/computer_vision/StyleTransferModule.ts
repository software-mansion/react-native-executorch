import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { StyleTransferModelName } from '../../types/styleTransfer';
import { ResourceSource, PixelData } from '../../types/common';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { Logger } from '../../common/Logger';
import { VisionModule } from './VisionModule';

/**
 * Module for style transfer tasks.
 *
 * @category Typescript API
 */
export class StyleTransferModule extends VisionModule<PixelData> {
  private constructor(nativeModule: unknown) {
    super();
    this.nativeModule = nativeModule;
  }
  /**
   * Creates a style transfer instance for a built-in model.
   *
   * @param namedSources - An object specifying which built-in model to load and where to fetch it from.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `StyleTransferModule` instance.
   */
  static async fromModelName(
    namedSources: {
      modelName: StyleTransferModelName;
      modelSource: ResourceSource;
    },
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<StyleTransferModule> {
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

      return new StyleTransferModule(await global.loadStyleTransfer(paths[0]));
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Creates a style transfer instance with a user-provided model binary.
   * Use this when working with a custom-exported model that is not one of the built-in presets.
   *
   * @remarks The native model contract for this method is not formally defined and may change
   * between releases. Refer to the native source code for the current expected tensor interface.
   *
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `StyleTransferModule` instance.
   */
  static fromCustomModel(
    modelSource: ResourceSource,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<StyleTransferModule> {
    return StyleTransferModule.fromModelName(
      { modelName: 'custom' as StyleTransferModelName, modelSource },
      onDownloadProgress
    );
  }

  async forward(input: string | PixelData): Promise<PixelData> {
    return super.forward(input);
  }
}
