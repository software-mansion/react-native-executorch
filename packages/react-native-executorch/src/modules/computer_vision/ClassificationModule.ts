import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { PixelData, ResourceSource } from '../../types/common';
import { ClassificationModelName } from '../../types/classification';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { Logger } from '../../common/Logger';
import { VisionModule } from './VisionModule';

/**
 * Module for image classification tasks.
 *
 * @category Typescript API
 */
export class ClassificationModule extends VisionModule<{
  [category: string]: number;
}> {
  private constructor(nativeModule: unknown) {
    super();
    this.nativeModule = nativeModule;
  }

  /**
   * Creates a classification instance for a built-in model.
   *
   * @param namedSources - An object specifying which built-in model to load and where to fetch it from.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `ClassificationModule` instance.
   */
  static async fromModelName(
    namedSources: {
      modelName: ClassificationModelName;
      modelSource: ResourceSource;
    },
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ClassificationModule> {
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

      return new ClassificationModule(
        await global.loadClassification(paths[0])
      );
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Creates a classification instance with a user-provided model binary.
   * Use this when working with a custom-exported model that is not one of the built-in presets.
   *
   * @remarks The native model contract for this method is not formally defined and may change
   * between releases. Refer to the native source code for the current expected tensor interface.
   *
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `ClassificationModule` instance.
   */
  static fromCustomModel(
    modelSource: ResourceSource,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ClassificationModule> {
    return ClassificationModule.fromModelName(
      { modelName: 'custom' as ClassificationModelName, modelSource },
      onDownloadProgress
    );
  }

  async forward(
    input: string | PixelData
  ): Promise<{ [category: string]: number }> {
    return super.forward(input);
  }
}
