import { TextEmbeddingsNativeModule } from '../../native/RnExecutorchModules';
import { ResourceSource } from '../../types/common';
import { BaseModule } from '../BaseModule';

export class TextEmbeddingsModule extends BaseModule {
  static nativeModule = TextEmbeddingsNativeModule;

  static async load(
    modelSource: ResourceSource,
    tokenizerSource: ResourceSource
  ) {
    await super.load(modelSource, tokenizerSource);
  }

  static async forward(input: string): Promise<number[]> {
    return super.forward(input);
  }
}
