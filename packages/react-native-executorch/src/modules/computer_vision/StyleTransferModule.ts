import { BaseCVModule } from './BaseCVModule';
import { _StyleTransferModule } from '../../native/RnExecutorchModules';

export class StyleTransferModule extends BaseCVModule {
  static module = new _StyleTransferModule();

  static async forward(input: string) {
    return await (super.forward(input) as ReturnType<
      _StyleTransferModule['forward']
    >);
  }
}
