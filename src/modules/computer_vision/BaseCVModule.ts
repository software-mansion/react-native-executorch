import { BaseModule } from '../BaseModule';
import {
  _StyleTransferModule,
  _ObjectDetectionModule,
  _ClassificationModule,
  _ImageSegmentationModule,
} from '../../native/RnExecutorchModules';
import { getError } from '../../Error';

export class BaseCVModule extends BaseModule {
  static module:
    | _StyleTransferModule
    | _ObjectDetectionModule
    | _ImageSegmentationModule
    | _ClassificationModule;

  static async forward(input: string) {
    try {
      return await this.module.forward(input);
    } catch (e) {
      throw new Error(getError(e));
    }
  }
}
