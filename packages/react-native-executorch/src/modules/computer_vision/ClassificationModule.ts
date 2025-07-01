import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { ETError, getError } from '../../Error';
import { BaseNonStaticModule } from '../BaseNonStaticModule';

export class ClassificationModule extends BaseNonStaticModule {
  async load(
    modelSource: ResourceSource,
    onDownloadProgressCallback: (_: number) => void = () => {}
  ): Promise<void> {
    const paths = await ResourceFetcher.fetch(
      onDownloadProgressCallback,
      modelSource
    );
    if (paths === null) {
      throw new Error('Download interrupted.');
    }
    this.nativeModule = global.loadClassification(paths[0] || '');
  }

  async forward(imageSource: string) {
    if (this.nativeModule == null)
      throw new Error(getError(ETError.ModuleNotLoaded));
    return await this.nativeModule.generate(imageSource);
  }
}
