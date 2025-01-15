import { BaseModule } from './BaseModule';
import { _ClassificationModule } from '../../native/RnExecutorchModules';

export class ClassificationModule {
  static async load(modelSource: string | number) {
    await BaseModule.load(_ClassificationModule, modelSource);
  }

  static async forward(input: string): Promise<{ [category: string]: number }> {
    return await BaseModule.forward(_ClassificationModule, input);
  }
}
