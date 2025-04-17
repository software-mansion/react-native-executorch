import {
  _ImageSegmentationModule,
  _StyleTransferModule,
  _ObjectDetectionModule,
  _ClassificationModule,
  _ETModule,
} from '../native/RnExecutorchModules';
import { ResourceFetcher } from '../utils/ResourceFetcher';
import { ResourceSource } from '../types/common';
import { getError } from '../Error';

export class BaseModule {
  static module:
    | _ImageSegmentationModule
    | _StyleTransferModule
    | _ObjectDetectionModule
    | _ClassificationModule
    | _ETModule;

  static onDownloadProgressCallback = (_downloadProgress: number) => {};

  static async load(modelSource: ResourceSource) {
    if (!modelSource) return;

    try {
      const fileUri = await ResourceFetcher.fetch(
        modelSource,
        this.onDownloadProgressCallback
      );
      await this.module.loadModule(fileUri);
    } catch (e) {
      throw new Error(getError(e));
    }
  }

  static async forward(..._: any[]): Promise<any> {
    throw new Error('The forward method is not implemented.');
  }

  static onDownloadProgress(callback: (downloadProgress: number) => void) {
    this.onDownloadProgressCallback = callback;
  }
}
