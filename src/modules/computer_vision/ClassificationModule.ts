import { ClassificationNativeModule } from '../../native/RnExecutorchModules';
import { ResourceSource } from '../../types/common';
import { BaseModule } from '../BaseModule';

export class ClassificationModule extends BaseModule {
  static nativeModule = ClassificationNativeModule;

  static async load(modelSource: ResourceSource) {
    await super.load(modelSource as string);
  }

  static async forward(
    input: string
  ): ReturnType<typeof ClassificationNativeModule.forward> {
    return await super.forward(input);
  }
}
