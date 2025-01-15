import { Image } from 'react-native';
import { getError } from '../../Error';

export class BaseModule {
  static async load(module: any, modelSource: string | number) {
    if (!modelSource) return;

    let path = modelSource;

    if (typeof modelSource === 'number') {
      path = Image.resolveAssetSource(modelSource).uri;
    }

    try {
      await module.loadModule(path);
    } catch (e) {
      throw new Error(getError(e));
    }
  }

  static async forward(module: any, input: string) {
    try {
      return await module.forward(input);
    } catch (e) {
      throw new Error(getError(e));
    }
  }
}
