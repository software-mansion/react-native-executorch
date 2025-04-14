import {
  calculateDownloadProgres,
  fetchResource,
} from '../utils/fetchResource';
import { getError } from '../Error';
import { ResourceSource } from '../types/common';

export class BaseModule {
  protected static nativeModule: any;
  static onDownloadProgressCallback: (downloadProgress: number) => void =
    () => {};

  static async load(...sources: ResourceSource[]): Promise<void> {
    const modelFileUris: string[] = [];

    for (const [idx, source] of sources.entries()) {
      const progressCallback = calculateDownloadProgres(
        sources.length,
        idx,
        this.onDownloadProgressCallback
      );

      try {
        const uri = await fetchResource(source, progressCallback);
        modelFileUris.push(uri);
      } catch (error) {
        throw new Error(getError(error));
      }
    }

    try {
      await this.nativeModule.loadModule(...modelFileUris);
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
