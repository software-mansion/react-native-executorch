import type { Tensor } from '../../core/tensor';
import { rnexecutorchJsi } from '../../native/bridge';

declare const llmRunnerBrand: unique symbol;

/**
 * Configuration options for LLM text generation.
 * @category Types
 */
export type GenerationConfig = {
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
 * @category Types
 */
export type GenerationStats = {
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
 * @category Types
 */
export type MediaInput =
  | { readonly kind: 'image'; readonly image: Tensor }
  | { readonly kind: 'audio'; readonly audio: Tensor };

/**
 * Supported non-text input modality keys (e.g. `'image'`, `'audio'`).
 * @category Types
 */
export type Modality = MediaInput['kind'];

/**
 * Text or interleaved multimodal prompt input for a low-level LLM runner.
 * @category Types
 */
export type Prompt = string | readonly (string | MediaInput)[];

/**
 * Handle to a native ExecuTorch LLM runner.
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
    config?: GenerationConfig,
    onToken?: (token: string) => void
  ): GenerationStats;

  /**
   * Prevents plain JS objects from being cast as LLMRunners.
   * @internal
   */
  readonly [llmRunnerBrand]: never;
};

/**
 * Creates a native ExecuTorch LLM runner instance.
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
