import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { DeeplabLabel } from '../../types/imageSegmentation';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { BaseModule } from '../BaseModule';
import { Logger } from '../../common/Logger';

/**
 * Module for image segmentation tasks.
 *
 * @category Typescript API
 */
export class ImageSegmentationModule extends BaseModule {
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

      this.nativeModule = global.loadImageSegmentation(paths[0]);
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Executes the model's forward pass
   *
   * @param imageSource - a fetchable resource or a Base64-encoded string.
   * @param classesOfInterest - an optional list of DeeplabLabel used to indicate additional arrays of probabilities to output (see section "Running the model"). The default is an empty list.
   * @param resizeToInput - an optional boolean to indicate whether the output should be resized to the original input image dimensions. If `false`, returns the model output without any resizing (see section "Running the model"). Defaults to `true`.
   * @returns A dictionary where keys are `DeeplabLabel` and values are arrays of probabilities for each pixel belonging to the corresponding class.
   */
  async forward(
    imageSource: string,
    classesOfInterest?: DeeplabLabel[],
    resizeToInput?: boolean
  ): Promise<Partial<Record<DeeplabLabel, number[]>>> {
    if (this.nativeModule == null) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    }

    const stringDict = await this.nativeModule.generate(
      imageSource,
      (classesOfInterest || []).map((label) => DeeplabLabel[label]),
      resizeToInput ?? true
    );

    let enumDict: { [key in DeeplabLabel]?: number[] } = {};

    for (const key in stringDict) {
      if (key in DeeplabLabel) {
        const enumKey = DeeplabLabel[key as keyof typeof DeeplabLabel];
        enumDict[enumKey] = stringDict[key];
      }
    }
    return enumDict;
  }
}
