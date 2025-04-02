import { Classification } from '../../native/RnExecutorchModules';
import { fetchResource } from '../../utils/fetchResource';
import { ResourceSource } from '../../types/common';
import { getError } from '../../Error';

export class ClassificationModule {
  static onDownloadProgressCallback = (_downloadProgress: number) => {};

  static async load(modelSource: ResourceSource) {
    try {
      const modelFileUri = await fetchResource(
        modelSource,
        this.onDownloadProgressCallback
      );
      await Classification.loadModule(modelFileUri);
    } catch (error) {
      throw new Error(getError(error));
    }
  }

  static async forward(input: string): Promise<{ [category: string]: number }> {
    try {
      return await Classification.forward(input);
    } catch (error) {
      throw new Error(getError(error));
    }
  }

  static onDownloadProgress(callback: (downloadProgress: number) => void) {
    this.onDownloadProgressCallback = callback;
  }
}
