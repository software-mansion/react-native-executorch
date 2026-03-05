import { ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { BaseModule } from '../BaseModule';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { Logger } from '../../common/Logger';

/**
 * Module for generating text embeddings from input text.
 *
 * @category Typescript API
 */
export class TextEmbeddingsModule extends BaseModule {
  private constructor(nativeModule: unknown) {
    super();
    this.nativeModule = nativeModule;
  }

  /**
   * Creates a `TextEmbeddingsModule` instance and loads the model and tokenizer.
   *
   * @param model - Object containing `modelName`, `modelSource`, and `tokenizerSource`.
   * @param onDownloadProgress - Optional callback to monitor download progress (value between 0 and 1).
   * @returns A Promise resolving to a ready-to-use `TextEmbeddingsModule` instance.
   */
  static async fromModelName(
    model: {
      modelName: string;
      modelSource: ResourceSource;
      tokenizerSource: ResourceSource;
    },
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<TextEmbeddingsModule> {
    try {
      const [modelResult, tokenizerResult] = await Promise.all([
        ResourceFetcher.fetch(onDownloadProgress, model.modelSource),
        ResourceFetcher.fetch(undefined, model.tokenizerSource),
      ]);
      const modelPath = modelResult?.[0];
      const tokenizerPath = tokenizerResult?.[0];
      if (!modelPath || !tokenizerPath) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.DownloadInterrupted,
          'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
        );
      }
      return new TextEmbeddingsModule(
        await global.loadTextEmbeddings(modelPath, tokenizerPath)
      );
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Executes the model's forward pass, where `input` is a text that will be embedded.
   *
   * @param input - The text string to embed.
   * @returns A Float32Array containing the vector embeddings.
   */
  async forward(input: string): Promise<Float32Array> {
    if (this.nativeModule == null)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    return new Float32Array(await this.nativeModule.generate(input));
  }
}
