import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { Detection } from '../../types/objectDetection';
import { ETError, getError } from '../../Error';
import { BaseModule } from '../BaseModule';

export class ObjectDetectionModule extends BaseModule {
  async load(
    model: { modelSource: ResourceSource },
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ): Promise<void> {
    const paths = await ResourceFetcher.fetch(
      onDownloadProgressCallback,
      model.modelSource
    );
    if (paths === null || paths.length < 1) {
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
