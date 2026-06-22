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
 * ColBERT): a [numTokens, embeddingDim] fp32 matrix (row-major) plus the input
 * token ids. Standard models return a single pooled `Float32Array` from
 * `forward` instead; only `multiVector` models yield this.
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
 * these, `forward` REQUIRES a `role` so the matching prompt is always applied
 * (forgetting it would silently embed raw text and wreck asymmetric retrieval).
 * @category Types
 */
export interface EmbeddingPrompts {
  query: string;
  document: string;
}

/**
 * A text embeddings model config. Two optional flags drive `forward`:
 * - `prompts` present  -> `forward` REQUIRES a `role` (auto-prepends the prompt)
 * - `multiVector` true -> `forward` returns the per-token `EmbeddingResult`;
 *                         otherwise it returns a single pooled `Float32Array`.
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
 * `forward`'s signature, computed from the model config:
 * - return type: `EmbeddingResult` if `multiVector`, else `Float32Array`.
 * - role arg: required if the model has `prompts`, else absent.
 */
export type ForwardReturn<M extends TextEmbeddingsModel> = M extends {
  multiVector: true;
}
  ? EmbeddingResult
  : Float32Array;

/**
 * `forward`'s signature, computed from the model config:
 * - A model that DEFINITELY has prompts -> `role` is REQUIRED.
 * - A model that definitely has NO prompts (`prompts?: undefined`) -> no role.
 * - Otherwise (prompts optional / unknown, e.g. a heterogeneous model list) ->
 *   `role` is OPTIONAL.
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
  error: null | RnExecutorchError;
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;

  /**
   * Embed text. Standard models return a single pooled `Float32Array`;
   * `multiVector` models return the per-token `EmbeddingResult`. Models with
   * `prompts` require a `role` ('query' | 'document').
   */
  forward: ForwardFn<M>;
}
