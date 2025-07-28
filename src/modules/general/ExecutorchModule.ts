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

    const inputTypeIdentifiers: number[] = [];
    const modelInputs: number[][] = [];

    for (const subInput of input) {
      const typeIdentifier = getTypeIdentifier(subInput);
      if (typeIdentifier === -1) {
        throw new Error(getError(ETError.InvalidArgument));
      }
      inputTypeIdentifiers.push(typeIdentifier);
      modelInputs.push(Array.from(subInput, (x: number | BigInt) => Number(x)));
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
