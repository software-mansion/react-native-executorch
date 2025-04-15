import { StyleTransferNativeModule } from '../../native/RnExecutorchModules';
import { ResourceSource } from '../../types/common';
import { BaseModule } from '../BaseModule';

export class StyleTransferModule extends BaseModule {
  protected static override nativeModule = StyleTransferNativeModule;

  static override async load(modelSource: ResourceSource) {
    return await super.load(modelSource);
  }

  static override async forward(
    input: string
  ): ReturnType<typeof this.nativeModule.forward> {
    return await this.nativeModule.forward(input);
  }
}
