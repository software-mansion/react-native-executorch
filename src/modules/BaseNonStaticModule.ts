import { ResourceFetcher } from '../utils/ResourceFetcher';
import { getError } from '../Error';
import { ResourceSource } from '../types/common';

export class BaseNonStaticModule {
  protected nativeModule: any;
  static onDownloadProgressStub: (downloadProgress: number) => void = () => {};

  static async loadFiles(
    onDownloadProgressCallback: (downloadProgress: number) => void,
    ...sources: ResourceSource[]
  ): Promise<string[]> {
    try {
      const paths = await ResourceFetcher.fetchMultipleResources(
        onDownloadProgressCallback,
        ...sources
      );
      return paths;
    } catch (error) {
      throw new Error(getError(error));
    }
  }
}
