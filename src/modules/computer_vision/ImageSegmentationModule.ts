import { BaseCVModule } from './BaseCVModule';
import { _ImageSegmentationModule } from '../../native/RnExecutorchModules';

export class ImageSegmentationModule extends BaseCVModule {
  static module = new _ImageSegmentationModule();

  static async forward(input: string) {
    return await (super.forward(input) as ReturnType<
      _ImageSegmentationModule['forward']
    >);
  }
}
