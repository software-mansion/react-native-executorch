import { Image } from 'react-native';
import { ETError, getError } from '../../Error';
import { _ETModule } from '../../native/RnExecutorchModules';
import { ETInput } from '../../types/common';

const getTypeIdentifier = (arr: ETInput): number => {
  if (arr instanceof Int8Array) return 0;
  if (arr instanceof Int32Array) return 1;
  if (arr instanceof BigInt64Array) return 2;
  if (arr instanceof Float32Array) return 3;
  if (arr instanceof Float64Array) return 4;

  return -1;
};

export class ExecutorchModule {
  protected module = new _ETModule();

  async loadModule(modelSource: string) {
    if (!modelSource) return;

    let path = modelSource;

    if (typeof modelSource === 'number') {
      path = Image.resolveAssetSource(modelSource).uri;
    }

    try {
      await this.module.loadModule(path);
    } catch (e) {
      throw new Error(getError(e));
    }
  }

  async forward(input: ETInput, shape: number[]) {
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

  async loadMethod(methodName: string) {
    try {
      await this.module.loadMethod(methodName);
    } catch (e) {
      throw new Error(getError(e));
    }
  }

  async loadForward() {
    await this.loadMethod('forward');
  }
}
