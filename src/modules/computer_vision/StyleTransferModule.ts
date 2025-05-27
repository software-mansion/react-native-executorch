import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { ETError, getError } from '../../Error';

export class StyleTransferModule {
  nativeModule: any = null;

  async load(
    modelSource: ResourceSource,
    onDownloadProgressCallback: (_: number) => void = () => {}
  ): Promise<void> {
    const paths = await ResourceFetcher.fetchMultipleResources(
      onDownloadProgressCallback,
      modelSource
    );
    this.nativeModule = global.loadStyleTransfer(paths[0] || '');
  }

  async forward(imageSource: string) {
    if (this.nativeModule == null)
      throw new Error(getError(ETError.ModuleNotLoaded));
    return await this.nativeModule.forward(imageSource);
  }

  delete() {
    this.nativeModule.unload();
  }
}
