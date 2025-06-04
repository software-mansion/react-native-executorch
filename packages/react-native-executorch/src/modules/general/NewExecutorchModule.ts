import { ETError, getError } from '../../Error';
import { ETModuleNativeModule } from '../../native/RnExecutorchModules';
import { ResourceSource } from '../../types/common';
import { ETInput } from '../../types/common';
import { getTypeIdentifier } from '../../types/common';
import { BaseModule } from '../BaseModule';

export class NewExecutorchModule {
  private nativeModule;

  constructor(modelSource: ResourceSource) {
    this.nativeModule = global.loadExecutorchModule(modelSource as string);
  }

  static async forward() {
    throw Error('Not yet implemented!');
  }

  static async getInputShape(methodName: string, index: number) {
    this.nativeModule.getInputShape();
  }

  static async loadForward() {
    await this.loadMethod('forward');
  }
}
