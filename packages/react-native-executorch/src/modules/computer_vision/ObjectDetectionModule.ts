import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { Detection } from '../../types/objectDetection';
import { ETErrorCode } from '../../errors/ErrorCodes';
import { ExecutorchError } from '../../errors/errorUtils';
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
      throw new ExecutorchError(
        ETErrorCode.DownloadInterrupted,
        'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
      );
    }
    this.nativeModule = global.loadObjectDetection(paths[0] || '');
  }

  async forward(
    imageSource: string,
    detectionThreshold: number = 0.7
  ): Promise<Detection[]> {
    if (this.nativeModule == null)
      throw new ExecutorchError(
        ETErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    return await this.nativeModule.generate(imageSource, detectionThreshold);
  }
}
