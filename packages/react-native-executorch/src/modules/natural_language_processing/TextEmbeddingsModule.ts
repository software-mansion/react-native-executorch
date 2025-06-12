import { TextEmbeddingsNativeModule } from '../../native/RnExecutorchModules';
import { ResourceSource } from '../../types/common';
import { BaseModule } from '../BaseModule';

export class TextEmbeddingsModule extends BaseModule {
  protected static override nativeModule = TextEmbeddingsNativeModule;
  private static meanPooling: boolean;

  static override async load(
    modelSource: ResourceSource,
    tokenizerSource: ResourceSource,
    meanPooling?: boolean
  ) {
    if (meanPooling === undefined) {
      console.warn(
        "You haven't passed meanPooling flag. It is defaulting to true. If your model doesn't require pooling it may misbehave."
      );
      meanPooling = true;
    }

    await super.load([modelSource, tokenizerSource]);
    this.meanPooling = meanPooling;
  }

  static override async forward(input: string): Promise<number[]> {
    return this.nativeModule.forward(input, this.meanPooling);
  }
}
