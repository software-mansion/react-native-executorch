import { Image } from 'react-native';
import {
  _StyleTransferModule,
  _ObjectDetectionModule,
  _ClassificationModule,
} from '../../native/RnExecutorchModules';
import { getError } from '../../Error';

export class BaseCVModule {
  static module:
    | _StyleTransferModule
    | _ObjectDetectionModule
    | _ClassificationModule;

  static async load(modelSource: string | number) {
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

  static async forward(input: string) {
    try {
      return await this.module.forward(input);
    } catch (e) {
      throw new Error(getError(e));
    }
  }
}
