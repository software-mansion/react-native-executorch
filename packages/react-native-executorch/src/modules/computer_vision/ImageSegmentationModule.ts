import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { DeeplabLabel } from '../../types/imageSegmentation';
import { ETError, getError } from '../../Error';

export class ImageSegmentationModule {
  nativeModule: any = null;

  async load(
    modelSource: ResourceSource,
    onDownloadProgressCallback: (_: number) => void = () => {}
  ): Promise<void> {
    const paths = await ResourceFetcher.fetchMultipleResources(
      onDownloadProgressCallback,
      modelSource
    );
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

    const stringDict = await this.nativeModule.forward(
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

  delete() {
    this.nativeModule.unload();
  }
}
