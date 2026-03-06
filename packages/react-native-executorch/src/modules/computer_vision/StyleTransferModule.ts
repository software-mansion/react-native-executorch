import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { StyleTransferModelName } from '../../types/styleTransfer';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { BaseModule } from '../BaseModule';
import { Logger } from '../../common/Logger';

/**
 * Module for style transfer tasks.
 *
 * @category Typescript API
 */
export class StyleTransferModule extends BaseModule {
  private constructor(nativeModule: unknown) {
    super();
    this.nativeModule = nativeModule;
  }

  /**
   * Creates a style transfer instance for a built-in model.
   *
   * @param model - An object specifying which built-in model to load and where to fetch it from.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `StyleTransferModule` instance.
   */
  static async fromModelName(
    model: { modelName: StyleTransferModelName; modelSource: ResourceSource },
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<StyleTransferModule> {
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

      return new StyleTransferModule(await global.loadStyleTransfer(paths[0]));
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Executes the model's forward pass to apply the selected style to the provided image.
   *
   * @param imageSource - A string image source (file path, URI, or Base64).
   * @returns A Promise resolving to the stylized image as a Base64-encoded string.
   */
  async forward(imageSource: string): Promise<string> {
    if (this.nativeModule == null)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    return await this.nativeModule.generate(imageSource);
  }
}
