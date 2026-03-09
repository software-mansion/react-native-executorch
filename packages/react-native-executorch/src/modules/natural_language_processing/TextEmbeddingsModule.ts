import { ResourceSource } from '../../types/common';
import { TextEmbeddingsModelName } from '../../types/textEmbeddings';
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
   * Creates a text embeddings instance for a built-in model.
   *
   * @param namedSources - An object specifying which built-in model to load and where to fetch it from.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `TextEmbeddingsModule` instance.
   */
  static async fromModelName(
    namedSources: {
      modelName: TextEmbeddingsModelName;
      modelSource: ResourceSource;
      tokenizerSource: ResourceSource;
    },
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<TextEmbeddingsModule> {
    try {
      const [modelResult, tokenizerResult] = await Promise.all([
        ResourceFetcher.fetch(onDownloadProgress, namedSources.modelSource),
        ResourceFetcher.fetch(undefined, namedSources.tokenizerSource),
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
   * Creates a text embeddings instance with a user-provided model binary and tokenizer.
   * Use this when working with a custom-exported model that is not one of the built-in presets.
   *
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param tokenizerSource - A fetchable resource pointing to the tokenizer file.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `TextEmbeddingsModule` instance.
   */
  static fromCustomModel(
    modelSource: ResourceSource,
    tokenizerSource: ResourceSource,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<TextEmbeddingsModule> {
    return TextEmbeddingsModule.fromModelName(
      {
        modelName: 'custom' as TextEmbeddingsModelName,
        modelSource,
        tokenizerSource,
      },
      onDownloadProgress
    );
  }

  /**
   * Executes the model's forward pass to generate an embedding for the provided text.
   *
   * @param input - The text string to embed.
   * @returns A Promise resolving to a `Float32Array` containing the embedding vector.
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
