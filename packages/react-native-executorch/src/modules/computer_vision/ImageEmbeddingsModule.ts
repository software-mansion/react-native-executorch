import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { ImageEmbeddingsModelName } from '../../types/imageEmbeddings';
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
   * Creates an image embeddings instance for a built-in model.
   *
   * @param namedSources - An object specifying which built-in model to load and where to fetch it from.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to an `ImageEmbeddingsModule` instance.
   */
  static async fromModelName(
    namedSources: {
      modelName: ImageEmbeddingsModelName;
      modelSource: ResourceSource;
    },
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ImageEmbeddingsModule> {
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

      return new ImageEmbeddingsModule(
        await global.loadImageEmbeddings(paths[0])
      );
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Creates an image embeddings instance with a user-provided model binary.
   * Use this when working with a custom-exported model that is not one of the built-in presets.
   *
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to an `ImageEmbeddingsModule` instance.
   */
  static fromCustomModel(
    modelSource: ResourceSource,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ImageEmbeddingsModule> {
    return ImageEmbeddingsModule.fromModelName(
      { modelName: 'custom' as ImageEmbeddingsModelName, modelSource },
      onDownloadProgress
    );
  }

  /**
   * Executes the model's forward pass to generate an embedding for the provided image.
   *
   * @param imageSource - A string image source (file path, URI, or Base64).
   * @returns A Promise resolving to a `Float32Array` containing the image embedding vector.
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
