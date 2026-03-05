import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
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
   * Creates a `StyleTransferModule` instance and loads the model.
   *
   * @param model - Object containing `modelSource`.
   * @param onDownloadProgress - Optional callback to monitor download progress (value between 0 and 1).
   * @returns A Promise resolving to a ready-to-use `StyleTransferModule` instance.
   */
  static async fromModelName(
    model: { modelSource: ResourceSource },
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
   * Executes the model's forward pass, where `imageSource` can be a fetchable resource or a Base64-encoded string.
   *
   * @param imageSource - The image source to be processed.
   * @returns The stylized image as a Base64-encoded string.
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
