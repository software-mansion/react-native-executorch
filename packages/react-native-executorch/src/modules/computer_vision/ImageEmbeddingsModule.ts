import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ImageEmbeddingsModelName } from '../../types/imageEmbeddings';
import { ResourceSource, PixelData } from '../../types/common';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { Logger } from '../../common/Logger';
import { VisionModule } from './VisionModule';

/**
 * Module for generating image embeddings from input images.
 * @category Typescript API
 */
export class ImageEmbeddingsModule extends VisionModule<Float32Array> {
  private constructor(nativeModule: unknown) {
    super();
    this.nativeModule = nativeModule;
  }
  /**
   * Creates an image embeddings instance for a built-in model.
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
   * @remarks The native model contract for this method is not formally defined and may change
   * between releases. Refer to the native source code for the current expected tensor interface.
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

  async forward(input: string | PixelData): Promise<Float32Array> {
    return new Float32Array((await super.forward(input)) as any);
  }
}
