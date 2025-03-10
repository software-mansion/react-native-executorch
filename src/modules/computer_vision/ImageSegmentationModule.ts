import { BaseModule } from '../BaseModule';
import { _ImageSegmentationModule } from '../../native/RnExecutorchModules';
import { getError } from '../../Error';

export class ImageSegmentationModule extends BaseModule {
  static module = new _ImageSegmentationModule();

  static async forward(input: string, classesOfInterest: string[]) {
    try {
      return await (this.module.forward(input, classesOfInterest) as ReturnType<
        _ImageSegmentationModule['forward']
      >);
    } catch (e) {
      throw new Error(getError(e));
    }
  }
}
