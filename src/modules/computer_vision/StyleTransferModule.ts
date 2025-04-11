import { StyleTransferNativeModule } from '../../native/RnExecutorchModules';
import { ResourceSource } from '../../types/common';
import { BaseModule } from '../BaseModule';

export class StyleTransferModule extends BaseModule {
  static nativeModule = StyleTransferNativeModule;

  static async load(modelSource: ResourceSource) {
    return await super.load(modelSource);
  }

  static async forward(
    input: string
  ): ReturnType<typeof this.nativeModule.forward> {
    return await super.forward(input);
  }
}
