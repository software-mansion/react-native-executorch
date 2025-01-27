import { Image } from 'react-native';
import {
  _StyleTransferModule,
  _ObjectDetectionModule,
  _ClassificationModule,
  _ETModule,
} from '../native/RnExecutorchModules';
import { ResourceSource } from '../types/common';
import { getError } from '../Error';

export class BaseModule {
  static module:
    | _StyleTransferModule
    | _ObjectDetectionModule
    | _ClassificationModule
    | _ETModule;

  static async load(modelSource: ResourceSource) {
    if (!modelSource) return;

    let path =
      typeof modelSource === 'number'
        ? Image.resolveAssetSource(modelSource).uri
        : modelSource;

    try {
      await this.module.loadModule(path);
    } catch (e) {
      throw new Error(getError(e));
    }
  }

  static async forward(..._: any[]): Promise<any> {
    throw new Error('The forward method is not implemented.');
  }
}
