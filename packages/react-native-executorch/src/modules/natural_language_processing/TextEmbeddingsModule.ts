import { ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { BaseNonStaticModule } from '../BaseNonStaticModule';

export class TextEmbeddingsModule extends BaseNonStaticModule {
  private meanPooling: boolean = true;

  async load(
    modelSource: ResourceSource,
    tokenizerSource: ResourceSource,
    meanPooling?: boolean,
    onDownloadProgressCallback: (_: number) => void = () => {}
  ): Promise<void> {
    const paths = await ResourceFetcher.fetchMultipleResources(
      onDownloadProgressCallback,
      modelSource,
      tokenizerSource
    );
    this.nativeModule = global.loadTextEmbeddings(
      paths[0] || '',
      paths[1] || ''
    );
    if (meanPooling === undefined) {
      this.meanPooling = true;
      console.warn(
        "You haven't passed meanPooling flag. It is defaulting to true, if your model doesn't require mean pooling it may return wrong results."
      );
    } else {
      this.meanPooling = meanPooling;
    }
  }

  async forward(input: string): Promise<Float32Array> {
    return new Float32Array(
      await this.nativeModule.generate(input, this.meanPooling)
    );
  }
}
