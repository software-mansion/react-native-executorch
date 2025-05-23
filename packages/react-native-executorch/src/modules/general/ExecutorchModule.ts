import { ETError, getError } from '../../Error';
import { ETModuleNativeModule } from '../../native/RnExecutorchModules';
import { ResourceSource } from '../../types/common';
import { ETInput } from '../../types/common';
import { getTypeIdentifier } from '../../types/common';
import { BaseModule } from '../BaseModule';

export class ExecutorchModule extends BaseModule {
  protected static override nativeModule = ETModuleNativeModule;

  static override async load(modelSource: ResourceSource) {
    return await super.load(modelSource);
  }

  static override async forward(input: ETInput[] | ETInput, shape: number[][]) {
    if (!Array.isArray(input)) {
      input = [input];
    }

    let inputTypeIdentifiers = [];
    let modelInputs = [];

    for (let idx = 0; idx < input.length; idx++) {
      let currentInputTypeIdentifier = getTypeIdentifier(input[idx] as ETInput);
      if (currentInputTypeIdentifier === -1) {
        throw new Error(getError(ETError.InvalidArgument));
      }
      inputTypeIdentifiers.push(currentInputTypeIdentifier);
      modelInputs.push([...(input[idx] as unknown as number[])]);
    }

    try {
      return await this.nativeModule.forward(
        modelInputs,
        shape,
        inputTypeIdentifiers
      );
    } catch (e) {
      throw new Error(getError(e));
    }
  }

  static async loadMethod(methodName: string) {
    try {
      await this.nativeModule.loadMethod(methodName);
    } catch (e) {
      throw new Error(getError(e));
    }
  }

  static async loadForward() {
    await this.loadMethod('forward');
  }
}
