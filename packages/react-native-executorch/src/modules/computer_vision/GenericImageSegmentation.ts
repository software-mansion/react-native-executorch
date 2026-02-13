import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { DeeplabLabel } from '../../types/imageSegmentation';
import { BaseModule } from '../BaseModule';

/**
 * Module for image segmentation tasks.
 *
 * @category Typescript API
 */

// Allow string or number values (standard Enums use numbers)
type LabelMap = Record<string, number | string>;

export class ImageSegmentationModule extends BaseModule {
  async load(
    modelSource: ResourceSource,
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ) {
    // Implementation of model loading...
  }

  /**
   * Generic forward pass that accepts a custom Label Enum.
   * * @param imageSource - Path to the image.
   * @param labelMap - The runtime Enum object (e.g., DeeplabLabel or a custom object).
   * @param classesOfInterest - Array of keys from the provided Enum (e.g., ['PERSON', 'DOG']).
   * @param resizeToInput - Whether to resize output to input dimensions.
   */
  public async forwardGeneric<T extends LabelMap>(
    imageSource: string,
    labelMap: T,
    classesOfInterest: (keyof T)[],
    resizeToInput: boolean = true
  ): Promise<Record<keyof T, number[]>> {
    // 1. Convert the string keys (e.g., "PERSON") to their numeric indices (e.g., 15)
    // We use the runtime 'labelMap' object to look up the values.
    const classIndices = (classesOfInterest || []).map(
      (label) => labelMap[label]
    );

    // 2. Call the native module with the numeric indices
    const result = await this.nativeModule.generate(
      imageSource,
      classIndices,
      resizeToInput
    );

    return result;
  }

  /**
   * Convenience wrapper for the default DeeplabLabel model.
   */
  public async forward(
    imageSource: string,
    classesOfInterest: (keyof typeof DeeplabLabel)[],
    resizeToInput: boolean = true
  ) {
    // Passes the default DeeplabLabel enum automatically
    return this.forwardGeneric(
      imageSource,
      DeeplabLabel,
      classesOfInterest,
      resizeToInput
    );
  }
}
