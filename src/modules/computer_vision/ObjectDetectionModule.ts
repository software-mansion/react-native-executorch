import { BaseCVModule } from './BaseCVModule';
import { _ObjectDetectionModule } from '../../native/RnExecutorchModules';

export class ObjectDetectionModule extends BaseCVModule {
  static module = new _ObjectDetectionModule();

  static async forward(input: string) {
    return await (super.forward(input) as ReturnType<
      _ObjectDetectionModule['forward']
    >);
  }
}
