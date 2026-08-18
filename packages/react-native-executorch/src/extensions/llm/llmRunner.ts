import type { Tensor } from '../../core/tensor';
import { rnexecutorchJsi } from '../../native/bridge';

declare const llmRunnerBrand: unique symbol;

/**
 * Configuration options for LLM text generation.
 * @experimental This API is experimental and might change in future releases.
 * @category Types
 */
export type LLMGenerationConfig = {
  /** Whether to echo the prompt in the generated output. */
  readonly echo?: boolean;
  /** Whether to ignore EOS tokens during generation. */
  readonly ignoreEos?: boolean;
  /** Maximum number of new tokens to generate. */
  readonly maxNewTokens?: number;
  /** Sampling temperature for token selection. */
  readonly temperature?: number;
};

/**
 * Execution and performance statistics for a generation call.
 * @experimental This API is experimental and might change in future releases.
 * @category Types
 */
export type LLMGenerationStats = {
  /** Number of tokens in the input prompt. */
  readonly numPromptTokens: number;
  /** Number of newly generated tokens. */
  readonly numGeneratedTokens: number;
  /** Time elapsed in milliseconds to generate the first token. */
  readonly firstTokenMs: number;
  /** Timestamp in milliseconds when inference started. */
  readonly inferenceStartMs: number;
  /** Timestamp in milliseconds when inference completed. */
  readonly inferenceEndMs: number;
  /** Timestamp in milliseconds when model loading started. */
  readonly modelLoadStartMs: number;
  /** Timestamp in milliseconds when model loading completed. */
  readonly modelLoadEndMs: number;
};

/**
 * Low-level non-text media input tensor payloads.
 * @experimental This API is experimental and might change in future releases.
 * @category Types
 */
export type MediaInput =
  | { readonly kind: 'image'; readonly image: Tensor }
  | { readonly kind: 'audio'; readonly audio: Tensor };

/**
 * Supported non-text input modality keys (e.g. `'image'`, `'audio'`).
 * @experimental This API is experimental and might change in future releases.
 * @category Types
 */
export type Modality = MediaInput['kind'];

/**
 * Text or interleaved multimodal prompt input for a low-level LLM runner.
 * @experimental This API is experimental and might change in future releases.
 * @category Types
 */
export type Prompt = string | readonly (string | MediaInput)[];

/**
 * Current KV cache state and capacity metrics for an LLM runner.
 * @experimental This API is experimental and might change in future releases.
 * @category Types
 */
export type LLMKVCacheState = {
  /** Current token position index / number of occupied tokens in the KV cache. */
  readonly pos: number;
  /** Maximum token capacity (context window) supported by the model. */
  readonly maxSeqLen: number;
  /** Remaining token capacity before the context window is full. */
  readonly remainingTokens: number;
  /** Fraction of the context window currently occupied (0.0 to 1.0). */
  readonly usageRatio: number;
};

/**
 * Handle to a native ExecuTorch LLM runner.
 * @experimental This API is experimental and might change in future releases. It
 * relies on experimental ExecuTorch runtime extensions and injected member-pointer
 * accessors to manage KV cache state that may evolve across releases.
 * @category Types
 */
export type LLMRunner = {
  /** Path to the local model file. */
  readonly modelPath: string;
  /** Path to the local tokenizer configuration file. */
  readonly tokenizerPath: string;
  /** List of supported non-text input modalities for this runner (e.g. `['image']`). */
  readonly modalities: readonly Modality[];

  /**
   * Disposes the native LLM runner and releases the loaded model memory.
   */
  dispose(): void;

  /**
   * Interrupts and stops any active generation call on this runner.
   */
  stop(): void;

  /**
   * Resets the runner KV cache. If `targetPos` is provided, sets the KV cache
   * start position to `targetPos`. Otherwise resets to 0.
   * @param targetPos Optional token position index to reset to.
   */
  reset(targetPos?: number): void;

  /**
   * Returns current KV cache occupancy and total context capacity metrics.
   */
  getKVCacheState(): LLMKVCacheState;

  /**
   * Prefills the runner with a prompt to build up the KV cache.
   * @param prompt The prefill text or multimodal prompt.
   */
  prefill(prompt: Prompt): void;

  /**
   * Generates text continuation from a prompt.
   * @param prompt The text or multimodal prompt to generate continuation for.
   * @param config Generation configuration options.
   * @param onToken Callback function triggered whenever a new token is generated.
   * @returns Generation performance statistics.
   */
  generate(
    prompt: Prompt,
    config?: LLMGenerationConfig,
    onToken?: (token: string) => void
  ): LLMGenerationStats;

  /**
   * Prevents plain JS objects from being cast as LLMRunners.
   * @internal
   */
  readonly [llmRunnerBrand]: never;
};

/**
 * Creates a native ExecuTorch LLM runner instance.
 * @experimental This API is experimental and might change in future releases. It
 * relies on experimental ExecuTorch runtime extensions and injected member-pointer
 * accessors to manage KV cache state that may evolve across releases.
 * @category Typescript API
 * @param modelPath Path to the local `.pte` model file.
 * @param tokenizerPath Path to the local tokenizer configuration file (e.g. `tokenizer.json`).
 * @param modalities List of supported input non-text modalities (e.g. `['image']`).
 * Defaults to text-only.
 * @returns A native LLMRunner instance.
 */
export function createLLMRunner(
  modelPath: string,
  tokenizerPath: string,
  modalities?: readonly Modality[]
): LLMRunner {
  'worklet';
  return rnexecutorchJsi.llm.createLLMRunner(modelPath, tokenizerPath, modalities ?? []);
}
