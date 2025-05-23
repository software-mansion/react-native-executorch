import { BaseModule } from '../BaseModule';
import { getError } from '../../Error';
import { DeeplabLabel } from '../../types/imageSegmentation';
import { ResourceSource } from '../../types/common';
import { ImageSegmentationNativeModule } from '../../native/RnExecutorchModules';

export class ImageSegmentationModule extends BaseModule {
  protected static override nativeModule = ImageSegmentationNativeModule;

  static override async load(modelSource: ResourceSource) {
    return await super.load(modelSource);
  }

  static override async forward(
    input: string,
    classesOfInterest?: DeeplabLabel[],
    resize?: boolean
  ) {
    try {
      const stringDict = await (this.nativeModule.forward(
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
