import { ClassificationNativeModule } from '../../native/RnExecutorchModules';
import { ResourceSource } from '../../types/common';
import { BaseModule } from '../BaseModule';

export class ClassificationModule extends BaseModule {
  protected static override nativeModule = ClassificationNativeModule;

  static override async load(modelSource: ResourceSource) {
    await super.load(modelSource);
  }

  static override async forward(
    input: string
  ): ReturnType<typeof ClassificationNativeModule.forward> {
    return await this.nativeModule.forward(input);
  }
}
