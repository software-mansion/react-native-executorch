import { RnExecutorchError } from '../errors/errorUtils';
import { ResourceSource } from '../types/common';

/**
 * Union of all built-in text embeddings model names.
 * @category Types
 */
export type TextEmbeddingsModelName =
  | 'all-minilm-l6-v2'
  | 'all-mpnet-base-v2'
  | 'multi-qa-minilm-l6-cos-v1'
  | 'multi-qa-mpnet-base-dot-v1'
  | 'distiluse-base-multilingual-cased-v2-8da4w'
  | 'paraphrase-multilingual-minilm-l12-v2-quantized'
  | 'clip-vit-base-patch32-text'
  | 'lfm2-5-embedding-350m'
  | 'lfm2-5-colbert-350m';

/**
 * Per-token (multi-vector) embedding output for late-interaction models (e.g.
 * ColBERT). Only `multiVector` models yield this; standard models return a
 * pooled `Float32Array` from `forward` instead.
 * @category Types
 */
export interface EmbeddingResult {
  /** Flat [numTokens * embeddingDim] fp32 vectors (row-major). */
  vectors: Float32Array;
  /** Number of token rows. */
  numTokens: number;
  /** Per-token vector dimension. */
  embeddingDim: number;
  /** Input token ids per row. */
  tokenIds: number[];
}

/**
 * Role for `forward`. Some models are trained with asymmetric query/document
 * prompts (e.g. LFM2.5 uses `query: `/`document: `, ColBERT uses `[Q] `/`[D] `).
 * Passing a role auto-prepends the model's configured prompt for that role.
 * @category Types
 */
export type EmbeddingRole = 'query' | 'document';

/**
 * Asymmetric prompts a model is trained with. When a model config carries
 * these, `forward` requires a `role` so the matching prompt is always applied.
 * @category Types
 */
export interface EmbeddingPrompts {
  query: string;
  document: string;
}

/**
 * A text embeddings model config. Two optional flags drive `forward`:
 * `prompts` makes a `role` argument required, and `multiVector` makes it return
 * a per-token `EmbeddingResult` instead of a pooled `Float32Array`.
 * @category Types
 */
export interface TextEmbeddingsModel {
  modelName: TextEmbeddingsModelName;
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
  prompts?: EmbeddingPrompts;
  multiVector?: boolean;
  /**
   * Document token ids to exclude from late-interaction scoring (e.g. ColBERT's
   * punctuation skipList). Derived from the model's training config, so it's
   * shipped here rather than reconstructed by the consumer, who passes it to
   * their own MaxSim scoring.
   */
  skipListIds?: number[];
}

/**
 * `forward`'s return type: `EmbeddingResult` for `multiVector` models,
 * `Float32Array` otherwise.
 */
export type ForwardReturn<M extends TextEmbeddingsModel> = M extends {
  multiVector: true;
}
  ? EmbeddingResult
  : Float32Array;

/**
 * `forward`'s signature, computed from the model config: `role` is required
 * when the model has `prompts`, omitted when it has none, and optional when
 * unknown (e.g. a heterogeneous model list).
 */
export type ForwardFn<M extends TextEmbeddingsModel> = M extends {
  prompts: EmbeddingPrompts;
}
  ? (input: string, role: EmbeddingRole) => Promise<ForwardReturn<M>>
  : undefined extends M['prompts']
    ? M['prompts'] extends undefined
      ? (input: string) => Promise<ForwardReturn<M>>
      : (input: string, role?: EmbeddingRole) => Promise<ForwardReturn<M>>
    : (input: string) => Promise<ForwardReturn<M>>;

/**
 * Props for the useTextEmbeddings hook.
 * @category Types
 * @property {object} model - An object containing the model configuration.
 * @property {TextEmbeddingsModelName} model.modelName - Unique name identifying the model.
 * @property {ResourceSource} model.modelSource - The source of the text embeddings model binary.
 * @property {ResourceSource} model.tokenizerSource - The source of the tokenizer JSON file.
 * @property {EmbeddingPrompts} [model.prompts] - Optional asymmetric prompts for query/document roles.
 * @property {boolean} [model.multiVector] - Optional flag indicating if the model returns per-token embeddings.
 * @property {number[]} [model.skipListIds] - Optional array of token IDs to skip during scoring.
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
 */
export interface TextEmbeddingsProps<
  M extends TextEmbeddingsModel = TextEmbeddingsModel,
> {
  model: M;
  preventLoad?: boolean;
}

/**
 * React hook state and methods for a Text Embeddings model instance.
 * @category Types
 */
export interface TextEmbeddingsType<
  M extends TextEmbeddingsModel = TextEmbeddingsModel,
> {
  /**
   * Contains the error message if the model failed to load or during inference.
   */
  error: null | RnExecutorchError;
  /**
   * Indicates whether the embeddings model has successfully loaded and is ready for inference.
   */
  isReady: boolean;
  /**
   * Indicates whether the model is currently generating embeddings.
   */
  isGenerating: boolean;
  /**
   * Tracks the progress of the model download process (value between 0 and 1).
   */
  downloadProgress: number;
  /**
   * Runs the text embeddings model on the provided input string.
   * @param input - The text string to embed.
   * @param role - Optional role for models with asymmetric prompts. Required if the model has `prompts`.
   * @returns A promise resolving to a Float32Array or EmbeddingResult containing the vector embeddings.
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another request.
   */
  forward: ForwardFn<M>;
}
