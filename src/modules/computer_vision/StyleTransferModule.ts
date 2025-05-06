import { ResourceSource } from '../../types/common';
import { BaseNonStaticModule } from '../BaseNonStaticModule';

export class StyleTransferModule extends BaseNonStaticModule {
  static async load(
    modelSource: ResourceSource,
    onDownloadProgressCallback = this.onDownloadProgressStub
  ): Promise<any> {
    const loadedPaths = await super.loadFiles(
      onDownloadProgressCallback,
      modelSource
    );
    return global.loadStyleTransfer(loadedPaths[0] || '');
  }
}
