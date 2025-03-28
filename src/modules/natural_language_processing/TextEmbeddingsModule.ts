import { TextEmbeddings } from '../../native/RnExecutorchModules';
import { fetchResource } from '../../utils/fetchResource';
import { ResourceSource } from '../../types/common';

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
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  static async forward(input: string) {
    try {
      return await TextEmbeddings.forward(input);
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  static onDownloadProgress(callback: (downloadProgress: number) => void) {
    this.onDownloadProgressCallback = callback;
  }
}
