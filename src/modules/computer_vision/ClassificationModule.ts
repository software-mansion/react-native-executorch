import { BaseCVModule } from './BaseCVModule';
import { _ClassificationModule } from '../../native/RnExecutorchModules';

export class ClassificationModule extends BaseCVModule {
  static module = new _ClassificationModule();

  static async forward(input: string) {
    return await (super.forward(input) as ReturnType<
      _ClassificationModule['forward']
    >);
  }
}
