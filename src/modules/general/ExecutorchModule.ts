import { BaseModule } from '../BaseModule';
import { ETError, getError } from '../../Error';
import { _ETModule } from '../../native/RnExecutorchModules';
import { ETInput, getTypeIdentifier } from '../../types/common';

export class ExecutorchModule extends BaseModule {
  static module = new _ETModule();

  static async forward(input: ETInput, shape: number[]) {
    const inputType = getTypeIdentifier(input);
    if (inputType === -1) {
      throw new Error(getError(ETError.InvalidArgument));
    }

    try {
      const numberArray = [...input] as number[];
      return await this.module.forward(numberArray, shape, inputType);
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
