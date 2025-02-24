import { BaseModule } from '../BaseModule';
import { ETError, getError } from '../../Error';
import { _ETModule } from '../../native/RnExecutorchModules';
import { ETInput } from '../../types/common';
import { getTypeIdentifier } from '../../hooks/useModule';

export class ExecutorchModule extends BaseModule {
  static module = new _ETModule();

  static async forward(input: ETInput[] | ETInput, shape: number[][]) {
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
      return await this.module.forward(
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
      await this.module.loadMethod(methodName);
    } catch (e) {
      throw new Error(getError(e));
    }
  }

  static async loadForward() {
    await this.loadMethod('forward');
  }
}
