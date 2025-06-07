import { ETError, getError } from '../../Error';
import { ETModuleNativeModule } from '../../native/RnExecutorchModules';
import { ResourceSource } from '../../types/common';
import { Tensor } from '../../types/common';
import { getTypeIdentifier } from '../../types/common';
import { BaseModule } from '../BaseModule';

export class ExecutorchModule extends BaseModule {
  protected static override nativeModule = ETModuleNativeModule;

  static override async load(modelSource: ResourceSource) {
    return await super.load(modelSource);
  }

  static override async forward(input: Tensor[] | Tensor) {
    if (!Array.isArray(input)) {
      input = [input];
    }

    let inputTypeIdentifiers = [];
    let shape = [];
    let modelInputs = [];

    for (let idx = 0; idx < input.length; idx++) {
      const currentInput = input[idx];
      if (!currentInput || !currentInput.data) {
        throw new Error('Input tensor is undefined.');
      }

      let currentInputTypeIdentifier = getTypeIdentifier(currentInput.data);
      if (currentInputTypeIdentifier === -1) {
        throw new Error(getError(ETError.InvalidArgument));
      }
      shape.push(currentInput.shape);
      inputTypeIdentifiers.push(currentInputTypeIdentifier);
      modelInputs.push([...(currentInput as unknown as number[])]);
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
