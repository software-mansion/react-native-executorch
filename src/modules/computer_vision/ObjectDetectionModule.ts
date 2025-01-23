import { BaseCVModule } from './BaseCVModule';
import { _ObjectDetectionModule } from '../../native/RnExecutorchModules';

export class ObjectDetectionModule extends BaseCVModule {
  static module = new _ObjectDetectionModule();

  static async forward(
    input: string
  ): ReturnType<_ObjectDetectionModule['forward']> {
    return await super.forward(input);
  }
}
