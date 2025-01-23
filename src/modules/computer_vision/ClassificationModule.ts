import { BaseCVModule } from './BaseCVModule';
import { _ClassificationModule } from '../../native/RnExecutorchModules';

export class ClassificationModule extends BaseCVModule {
  static module = new _ClassificationModule();

  static async forward(
    input: string
  ): ReturnType<_ClassificationModule['forward']> {
    return await super.forward(input);
  }
}
