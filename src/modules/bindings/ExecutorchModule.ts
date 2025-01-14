import { Image } from 'react-native';
import { ETError, getError } from '../../Error';
import { _ETModule } from '../../native/RnExecutorchModules';
import { ETInput, getTypeIdentifier } from '../../types/common';

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
