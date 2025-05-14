import { ResourceSource } from '../../types/common';
import { BaseNonStaticModule } from '../BaseNonStaticModule';

export class ImageSegmentationModule extends BaseNonStaticModule {
  static async load(
    modelSource: ResourceSource,
    onDownloadProgressCallback = this.onDownloadProgressStub
  ): Promise<any> {
    const loadedPaths = await super.loadFiles(
      onDownloadProgressCallback,
      modelSource
    );
    return global.loadImageSegmentation(loadedPaths[0] || '');
  }
}
