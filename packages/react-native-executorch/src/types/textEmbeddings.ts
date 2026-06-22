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
 * Raw text embedding output: a [numTokens, embeddingDim] fp32 matrix (row-
 * major) plus the input token ids. Single-vector (pooled) models give
 * numTokens === 1 — use `toVector` for that common case. Multi-vector (late-
 * interaction, e.g. ColBERT) models give the full per-token sequence; scoring
 * (e.g. MaxSim) is the consumer's concern.
 * @category Types
 */
export interface EmbeddingResult {
  /** Flat [numTokens * embeddingDim] fp32 vectors (row-major). */
  vectors: Float32Array;
  /** Number of token rows (1 for pooled models). */
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

/** A standard (symmetric) embedding model — `forward(text)`, no role. */
export interface TextEmbeddingsModel {
  modelName: TextEmbeddingsModelName;
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
  prompts?: undefined;
}

/**
 * An asymmetric model with query/document prompts — `forward(text, role)` with
 * role REQUIRED.
 */
export interface PromptedTextEmbeddingsModel {
  modelName: TextEmbeddingsModelName;
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
  prompts: EmbeddingPrompts;
}

export type AnyTextEmbeddingsModel =
  | TextEmbeddingsModel
  | PromptedTextEmbeddingsModel;

/**
 * `forward`'s signature, discriminated by the model: prompted models require a
 * `role` argument; standard models take none.
 */
export type ForwardFn<M extends AnyTextEmbeddingsModel> =
  M extends PromptedTextEmbeddingsModel
    ? (input: string, role: EmbeddingRole) => Promise<EmbeddingResult>
    : (input: string) => Promise<EmbeddingResult>;

/**
 * Props for the useTextEmbeddings hook.
 * @category Types
 */
export interface TextEmbeddingsProps<
  M extends AnyTextEmbeddingsModel = AnyTextEmbeddingsModel,
> {
  model: M;
  preventLoad?: boolean;
}

/**
 * React hook state and methods for a Text Embeddings model instance.
 * @category Types
 */
export interface TextEmbeddingsType<
  M extends AnyTextEmbeddingsModel = AnyTextEmbeddingsModel,
> {
  error: null | RnExecutorchError;
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;

  /**
   * Embed text into a [numTokens, embeddingDim] result. Pooled models return
   * numTokens === 1 (use `toVector`); multi-vector models return the full
   * per-token sequence. Models with prompts require a `role`
   * ('query' | 'document'); standard models take none.
   */
  forward: ForwardFn<M>;
}
