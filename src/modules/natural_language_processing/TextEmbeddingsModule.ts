import { TextEmbeddings } from '../../native/RnExecutorchModules';
import { fetchResource } from '../../utils/fetchResource';
import { ResourceSource } from '../../types/common';
import { getError } from '../../Error';

export class TextEmbeddingsModule {
  static onDownloadProgressCallback = (_downloadProgress: number) => {};

  static async load(
    modelSource: ResourceSource,
    tokenizerSource: ResourceSource
  ) {
    try {
      const tokenizerFileUri = await fetchResource(tokenizerSource);
      const modelFileUri = await fetchResource(
        modelSource,
        this.onDownloadProgressCallback
      );
      await TextEmbeddings.loadModule(modelFileUri, tokenizerFileUri);
    } catch (error) {
      throw new Error(getError(error));
    }
  }

  static async forward(input: string): Promise<number[]> {
    try {
      return await TextEmbeddings.forward(input);
    } catch (error) {
      throw new Error(getError(error));
    }
  }

  static onDownloadProgress(callback: (downloadProgress: number) => void) {
    this.onDownloadProgressCallback = callback;
  }
}
