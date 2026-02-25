import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource, PixelData } from '../../types/common';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { Logger } from '../../common/Logger';
import { VisionModule } from './VisionModule';

/**
 * Module for generating image embeddings from input images.
 *
 * @category Typescript API
 */
export class ImageEmbeddingsModule extends VisionModule<Float32Array> {
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

  async forward(input: string | PixelData): Promise<Float32Array> {
    const result = await super.forward(input);
    return new Float32Array(result as unknown as ArrayBuffer);
  }
}
