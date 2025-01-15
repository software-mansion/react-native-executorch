import { BaseModule } from './BaseModule';
import { _StyleTransferModule } from '../../native/RnExecutorchModules';

export class StyleTransferModule {
  static async load(modelSource: string | number) {
    await BaseModule.load(_StyleTransferModule, modelSource);
  }

  static async forward(input: string): Promise<string> {
    return await BaseModule.forward(_StyleTransferModule, input);
  }
}
