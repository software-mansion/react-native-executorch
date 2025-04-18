import { BaseModule } from '../BaseModule';
import { _ImageSegmentationModule } from '../../native/RnExecutorchModules';
import { getError } from '../../Error';
import { DeeplabLabel } from '../../types/image_segmentation';

export class ImageSegmentationModule extends BaseModule {
  static module = new _ImageSegmentationModule();

  static async forward(
    input: string,
    classesOfInterest?: DeeplabLabel[],
    resize?: boolean
  ) {
    try {
      const stringDict = await (this.module.forward(
        input,
        (classesOfInterest || []).map((label) => DeeplabLabel[label]),
        resize || false
      ) as ReturnType<_ImageSegmentationModule['forward']>);

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
