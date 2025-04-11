import { BaseModule } from '../BaseModule';
import { getError } from '../../Error';
import { DeeplabLabel } from '../../types/image_segmentation';
import { ResourceSource } from '../../types/common';
import { ImageSegmentationNativeModule } from '../../native/RnExecutorchModules';

export class ImageSegmentationModule extends BaseModule {
  static nativeModule = ImageSegmentationNativeModule;

  static async load(modelSource: ResourceSource) {
    return await super.load(modelSource);
  }

  static async forward(
    input: string,
    classesOfInterest?: DeeplabLabel[],
    resize?: boolean
  ) {
    try {
      const stringDict = await (super.forward(
        input,
        (classesOfInterest || []).map((label) => DeeplabLabel[label]),
        resize || false
      ) as ReturnType<(typeof this.nativeModule)['forward']>);

      let enumDict: { [key in DeeplabLabel]?: number[] } = {};

      for (const key in stringDict) {
        if (key in DeeplabLabel) {
          const enumKey = DeeplabLabel[key as keyof typeof DeeplabLabel];
          enumDict[enumKey] = stringDict[key];
        }
      }
      return enumDict;
    } catch (e) {
      throw new Error(getError(e));
    }
  }
}
