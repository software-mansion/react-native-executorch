import { ResourceSource } from '../../types/common';
import {
  EmbeddingPrompts,
  EmbeddingResult,
  EmbeddingRole,
  TextEmbeddingsModel,
  TextEmbeddingsModelName,
} from '../../types/textEmbeddings';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { BaseModule } from '../BaseModule';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { Logger } from '../../common/Logger';

/**
 * Module for managing a Text Embeddings model instance.
 * @category Typescript API
 */
export class TextEmbeddingsModule extends BaseModule {
  private prompts?: EmbeddingPrompts;
  private multiVector: boolean;

  private constructor(
    nativeModule: unknown,
    prompts: EmbeddingPrompts | undefined,
    multiVector: boolean
  ) {
    super();
    this.nativeModule = nativeModule;
    this.prompts = prompts;
    this.multiVector = multiVector;
  }

  /**
   * Creates a text embeddings instance for a built-in model.
   * @param namedSources - The model config (+ optional prompts / multiVector).
   * @param onDownloadProgress - Optional download progress callback (0..1).
   */
  static async fromModelName(
    namedSources: TextEmbeddingsModel,
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
        throw new RnExecutorchError(RnExecutorchErrorCode.DownloadInterrupted);
      }
      return new TextEmbeddingsModule(
        await global.loadTextEmbeddings(modelPath, tokenizerPath),
        namedSources.prompts,
        namedSources.multiVector ?? false
      );
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Creates a text embeddings instance from a custom model binary + tokenizer.
   * @remarks The native tensor contract is not formally guaranteed across
   * releases.
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
   * Embed text into a pooled `Float32Array`, or a per-token `EmbeddingResult`
   * for `multiVector` models.
   * @param input - The text to embed.
   * @param role - 'query' | 'document'; prepends the model's prompt for that
   *   role when configured.
   * @returns A `Float32Array` for pooled models, an `EmbeddingResult` otherwise.
   */
  async forward(
    input: string,
    role?: EmbeddingRole
  ): Promise<Float32Array | EmbeddingResult> {
    if (this.nativeModule == null)
      throw new RnExecutorchError(RnExecutorchErrorCode.ModuleNotLoaded);
    const prefix = (role && this.prompts?.[role]) || '';
    const res = await this.nativeModule.generate(prefix + input);
    const vectors = res.dataPtr as Float32Array;
    if (!this.multiVector) {
      return vectors.subarray(0, res.embeddingDim);
    }
    return {
      vectors,
      numTokens: res.numTokens,
      embeddingDim: res.embeddingDim,
      tokenIds: res.tokenIds,
    };
  }
}
