import { fetchResource } from '../utils/fetchResource';
import { getError } from '../Error';
import { ResourceSource } from '../types/common';

export class BaseModule {
  static nativeModule: any;
  static onDownloadProgressCallback: (downloadProgress: number) => void =
    () => {};

  static async load(...sources: ResourceSource[]): Promise<void> {
    try {
      const modelFileUris = await Promise.all(
        sources.map((source) =>
          fetchResource(source, this.onDownloadProgressCallback)
        )
      );
      await this.nativeModule.loadModule(...modelFileUris);
    } catch (error) {
      throw new Error(getError(error));
    }
  }

  static async forward(...args: any[]) {
    try {
      return await this.nativeModule.forward(...args);
    } catch (error) {
      throw new Error(getError(error));
    }
  }

  static onDownloadProgress(callback: (downloadProgress: number) => void) {
    this.onDownloadProgressCallback = callback;
  }
}
