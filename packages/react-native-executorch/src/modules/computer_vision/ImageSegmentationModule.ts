import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { DeeplabLabel } from '../../types/imageSegmentation';
import { ETError, getError } from '../../Error';
import { BaseNonStaticModule } from '../BaseNonStaticModule';

export class ImageSegmentationModule extends BaseNonStaticModule {
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
    this.nativeModule = global.loadImageSegmentation(paths[0] || '');
  }

  async forward(
    imageSource: string,
    classesOfInterest?: DeeplabLabel[],
    resize?: boolean
  ): Promise<{ [key in DeeplabLabel]?: number[] }> {
    if (this.nativeModule == null) {
      throw new Error(getError(ETError.ModuleNotLoaded));
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
