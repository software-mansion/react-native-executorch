import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { DeeplabLabel } from '../../types/imageSegmentation';
import { ETErrorCode } from '../../errors/ErrorCodes';
import { ExecutorchError } from '../../errors/errorUtils';
import { BaseModule } from '../BaseModule';

export class ImageSegmentationModule extends BaseModule {
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
    this.nativeModule = global.loadImageSegmentation(paths[0] || '');
  }

  async forward(
    imageSource: string,
    classesOfInterest?: DeeplabLabel[],
    resize?: boolean
  ): Promise<{ [key in DeeplabLabel]?: number[] }> {
    if (this.nativeModule == null) {
      throw new ExecutorchError(
        ETErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    }

    const stringDict = await this.nativeModule.generate(
      imageSource,
      (classesOfInterest || []).map((label) => DeeplabLabel[label]),
      resize || false
    );

    let enumDict: { [key in DeeplabLabel]?: number[] } = {};

    for (const key in stringDict) {
      if (key in DeeplabLabel) {
        const enumKey = DeeplabLabel[key as keyof typeof DeeplabLabel];
        enumDict[enumKey] = stringDict[key];
      }
    }
    return enumDict;
  }
}
