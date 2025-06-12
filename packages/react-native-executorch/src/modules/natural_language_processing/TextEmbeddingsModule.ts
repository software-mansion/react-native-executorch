import { TextEmbeddingsNativeModule } from '../../native/RnExecutorchModules';
import { ResourceSource } from '../../types/common';
import { BaseModule } from '../BaseModule';

export class TextEmbeddingsModule extends BaseModule {
  protected static override nativeModule = TextEmbeddingsNativeModule;

  static override async load(
    modelSource: ResourceSource,
    tokenizerSource: ResourceSource
  ) {
    await super.load([modelSource, tokenizerSource]);
  }

  static override async forward(input: string): Promise<number[]> {
    return this.nativeModule.forward(input);
  }
}
