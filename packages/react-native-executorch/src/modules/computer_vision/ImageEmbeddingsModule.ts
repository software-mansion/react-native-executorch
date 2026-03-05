import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { BaseModule } from '../BaseModule';
import { Logger } from '../../common/Logger';

/**
 * Module for generating image embeddings from input images.
 *
 * @category Typescript API
 */
export class ImageEmbeddingsModule extends BaseModule {
  private constructor(nativeModule: unknown) {
    super();
    this.nativeModule = nativeModule;
  }

  /**
   * Creates an `ImageEmbeddingsModule` instance and loads the model.
   *
   * @param model - Object containing `modelSource`.
   * @param onDownloadProgress - Optional callback to monitor download progress (value between 0 and 1).
   * @returns A Promise resolving to a ready-to-use `ImageEmbeddingsModule` instance.
   */
  static async fromModelName(
    model: { modelName: string; modelSource: ResourceSource },
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ImageEmbeddingsModule> {
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

      return new ImageEmbeddingsModule(await global.loadImageEmbeddings(paths[0]));
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Executes the model's forward pass. Returns an embedding array for a given sentence.
   *
   * @param imageSource - The image source (URI/URL) to image that will be embedded.
   * @returns A Float32Array containing the image embeddings.
   */
  async forward(imageSource: string): Promise<Float32Array> {
    if (this.nativeModule == null)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    return new Float32Array(await this.nativeModule.generate(imageSource));
  }
}
