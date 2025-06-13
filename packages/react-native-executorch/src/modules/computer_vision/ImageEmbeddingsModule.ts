import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { getArrayConstructor, ResourceSource } from '../../types/common';
import { TensorPtr } from '../../types/common';
import { ETError, getError } from '../../Error';
import { BaseNonStaticModule } from '../BaseNonStaticModule';

export class ImageEmbeddingsModule extends BaseNonStaticModule {
  async load(
    modelSource: ResourceSource,
    onDownloadProgressCallback: (_: number) => void = () => {}
  ): Promise<void> {
    const paths = await ResourceFetcher.fetchMultipleResources(
      onDownloadProgressCallback,
      modelSource
    );
    this.nativeModule = global.loadImageEmbeddings(paths[0] || '');
  }

  async forward(imageSource: string): Promise<number[]> {
    if (this.nativeModule == null)
      throw new Error(getError(ETError.ModuleNotLoaded));
    const tensor: TensorPtr = await this.nativeModule.generate(imageSource);

    const resultArray = getArrayConstructor(tensor.scalarType)(tensor.dataPtr);

    return Array.from(resultArray);
  }
}
