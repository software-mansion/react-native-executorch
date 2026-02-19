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
  /**
   * Loads the model, where `modelSource` is a string that specifies the location of the model binary.
   *
   * @param model - Object containing `modelSource`.
   * @param onDownloadProgressCallback - Optional callback to monitor download progress.
   */
  async load(
    model: { modelSource: ResourceSource },
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ): Promise<void> {
    try {
      const paths = await ResourceFetcher.fetch(
        onDownloadProgressCallback,
        model.modelSource
      );

      if (!paths?.[0]) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.DownloadInterrupted,
          'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
        );
      }

      this.nativeModule = global.loadImageEmbeddings(paths[0]);
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
