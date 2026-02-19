import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { Detection } from '../../types/objectDetection';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { BaseModule } from '../BaseModule';
import { Logger } from '../../common/Logger';

/**
 * Module for object detection tasks.
 *
 * @category Typescript API
 */
export class ObjectDetectionModule extends BaseModule {
  /**
   * Loads the model, where `modelSource` is a string that specifies the location of the model binary.
   * To track the download progress, supply a callback function `onDownloadProgressCallback`.
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

      if (paths === null || paths.length < 1 || paths[0] === undefined) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.DownloadInterrupted,
          'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
        );
      }

      this.nativeModule = global.loadObjectDetection(paths[0]);
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Executes the model's forward pass, where `imageSource` can be a fetchable resource or a Base64-encoded string.
   * `detectionThreshold` can be supplied to alter the sensitivity of the detection.
   *
   * @param imageSource - The image source to be processed.
   * @param detectionThreshold - The threshold for detection sensitivity. Default is 0.7.
   * @returns An array of Detection objects representing detected items in the image.
   */
  async forward(
    imageSource: string,
    detectionThreshold: number = 0.7
  ): Promise<Detection[]> {
    if (this.nativeModule == null)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    return await this.nativeModule.generate(imageSource, detectionThreshold);
  }
}
