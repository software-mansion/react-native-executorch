import { ResourceSource } from '../../types/common';
import {
  AnyTextEmbeddingsModel,
  EmbeddingPrompts,
  EmbeddingResult,
  EmbeddingRole,
  TextEmbeddingsModelName,
} from '../../types/textEmbeddings';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { BaseModule } from '../BaseModule';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { Logger } from '../../common/Logger';

/**
 * Module for text embeddings. Returns the raw [numTokens, embeddingDim] output
 * for any model — pooled (numTokens === 1) or multi-vector. Scoring / pooling
 * is the consumer's concern (see the `toVector` util for the single-vector
 * common case).
 * @category Typescript API
 */
export class TextEmbeddingsModule extends BaseModule {
  private prompts?: EmbeddingPrompts;

  private constructor(nativeModule: unknown, prompts?: EmbeddingPrompts) {
    super();
    this.nativeModule = nativeModule;
    this.prompts = prompts;
  }

  /**
   * Creates a text embeddings instance for a built-in model.
   * @param namedSources - The model + tokenizer sources.
   * @param onDownloadProgress - Optional download progress callback (0..1).
   */
  static async fromModelName(
    namedSources: AnyTextEmbeddingsModel,
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
        namedSources.prompts
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
   * Embed text. Returns the raw [numTokens, embeddingDim] result.
   * @param input - The text to embed.
   * @param role - Optional 'query' | 'document'; prepends the model's prompt
   *   for that role when configured (no-op otherwise).
   */
  async forward(
    input: string,
    role?: EmbeddingRole
  ): Promise<EmbeddingResult> {
    if (this.nativeModule == null)
      throw new RnExecutorchError(RnExecutorchErrorCode.ModuleNotLoaded);
    const prefix = (role && this.prompts?.[role]) || '';
    const res = await this.nativeModule.generate(prefix + input);
    // res.dataPtr is already a Float32Array view over the owned native buffer
    // (built at the JSI boundary), so use it directly — no extra copy.
    return {
      vectors: res.dataPtr as Float32Array,
      numTokens: res.numTokens,
      embeddingDim: res.embeddingDim,
      tokenIds: res.tokenIds,
    };
  }
}
