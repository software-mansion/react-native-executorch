import { Image } from 'react-native';
import { getError } from '../../Error';

export class BaseModule {
  protected module: any;

  constructor(module: any) {
    this.module = module;
  }

  async loadModule(modelSource: string | number) {
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

  async forward(input: string) {
    try {
      return await this.module.forward(input);
    } catch (e) {
      throw new Error(getError(e));
    }
  }
}
