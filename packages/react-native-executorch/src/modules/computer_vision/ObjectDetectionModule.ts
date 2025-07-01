import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { Detection } from '../../types/objectDetection';
import { ETError, getError } from '../../Error';
import { BaseNonStaticModule } from '../BaseNonStaticModule';

export class ObjectDetectionModule extends BaseNonStaticModule {
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
    this.nativeModule = global.loadObjectDetection(paths[0] || '');
  }

  async forward(
    imageSource: string,
    detectionThreshold: number = 0.7
  ): Promise<Detection[]> {
    if (this.nativeModule == null)
      throw new Error(getError(ETError.ModuleNotLoaded));
    return await this.nativeModule.generate(imageSource, detectionThreshold);
  }
}
