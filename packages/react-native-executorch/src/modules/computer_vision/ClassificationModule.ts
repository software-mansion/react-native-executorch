import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { ClassificationModelName } from '../../types/classification';
import { BaseModule } from '../BaseModule';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { Logger } from '../../common/Logger';

/**
 * Module for image classification tasks.
 *
 * @category Typescript API
 */
export class ClassificationModule extends BaseModule {
  private constructor(nativeModule: unknown) {
    super();
    this.nativeModule = nativeModule;
  }

  /**
   * Creates a classification instance for a built-in model.
   *
   * @param model - An object specifying which built-in model to load and where to fetch it from.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `ClassificationModule` instance.
   */
  static async fromModelName(
    model: { modelName: ClassificationModelName; modelSource: ResourceSource },
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ClassificationModule> {
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

      return new ClassificationModule(global.loadClassification(paths[0]));
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Executes the model's forward pass to classify the provided image.
   *
   * @param imageSource - A string image source (file path, URI, or Base64).
   * @returns A Promise resolving to an object mapping category labels to confidence scores.
   */
  async forward(imageSource: string): Promise<{ [category: string]: number }> {
    if (this.nativeModule == null)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    return await this.nativeModule.generate(imageSource);
  }
}
