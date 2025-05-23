import { ResourceFetcher } from '../utils/ResourceFetcher';
import { getError } from '../Error';
import { ResourceSource } from '../types/common';

export class BaseModule {
  protected static nativeModule: any;
  static onDownloadProgressCallback: (downloadProgress: number) => void =
    () => {};

  static async load(...sources: ResourceSource[]): Promise<void> {
    try {
      const paths = await ResourceFetcher.fetchMultipleResources(
        this.onDownloadProgressCallback,
        ...sources
      );
      await this.nativeModule.loadModule(...paths);
    } catch (error) {
      throw new Error(getError(error));
    }
  }

  protected static async forward(..._args: any[]): Promise<any> {
    throw new Error(
      'forward method is not implemented in the BaseModule class. Please implement it in the derived class.'
    );
  }

  static onDownloadProgress(callback: (downloadProgress: number) => void) {
    this.onDownloadProgressCallback = callback;
  }
}
