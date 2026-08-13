import type { Tensor } from '../../core/tensor';
import { rnexecutorchJsi } from '../../native/bridge';

declare const llmRunnerBrand: unique symbol;

/** Configuration options for LLM text generation. */
export type GenerationConfig = {
  readonly echo?: boolean;
  readonly ignoreEos?: boolean;
  readonly maxNewTokens?: number;
  readonly temperature?: number;
};

/** Execution and performance statistics for a generation call. */
export type GenerationStats = {
  readonly numPromptTokens: number;
  readonly numGeneratedTokens: number;
  readonly firstTokenMs: number;
  readonly inferenceStartMs: number;
  readonly inferenceEndMs: number;
  readonly modelLoadStartMs: number;
  readonly modelLoadEndMs: number;
};

/** Map of supported non-text media input modalities to native tensor payloads. */
export type MediaInputMap = {
  /** Image modality input holding a preprocessed float32 image tensor. */
  image: { readonly kind: 'image'; readonly image: Tensor };
  /** Audio modality input holding a preprocessed float32 audio waveform tensor. */
  audio: { readonly kind: 'audio'; readonly audio: Tensor };
};

/** Supported non-text input modality keys (e.g. `'image'`, `'audio'`). */
export type Modality = keyof MediaInputMap;

/** Extracts native media input tensor objects for allowed modalities `M`. */
export type MediaInput<M extends Modality = Modality> = MediaInputMap[M];

/**
 * Text or interleaved multimodal prompt input for a low-level LLM runner.
 * Restricts strictly to a single text string when `M` is `never`.
 */
export type Prompt<M extends Modality = never> = [M] extends [never]
  ? string
  : string | readonly (string | MediaInput<M>)[];

/** Handle to a native ExecuTorch LLM runner. */
export type LLMRunner<M extends Modality = never> = {
  /** Path to the local model file. */
  readonly modelPath: string;
  /** Path to the local tokenizer configuration file. */
  readonly tokenizerPath: string;
  /** List of supported non-text input modalities for this runner (e.g. 'image', 'audio'). */
  readonly modalities: readonly M[];

  /** Disposes the native LLM runner and releases the loaded model memory. */
  dispose(): void;

  /** Interrupts and stops any active generation call on this runner. */
  stop(): void;

  /**
   * Prefills the runner with a prompt to build up the KV cache.
   * @param prompt The prefill text or multimodal prompt.
   */
  prefill(prompt: Prompt<M>): void;

  /**
   * Generates text continuation from a prompt.
   * @param prompt The text or multimodal prompt to generate continuation for.
   * @param config Generation configuration options.
   * @param onToken Callback function triggered whenever a new token is generated.
   * @returns Generation performance statistics.
   */
  generate(
    prompt: Prompt<M>,
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
 * @param modelPath Path to the local .pte model file.
 * @param tokenizerPath Path to the local tokenizer configuration file (e.g. tokenizer.json).
 * @param modalities List of supported input non-text modalities (e.g. `['image']`).
 * Defaults to text-only.
 * @returns A native LLMRunner instance.
 */
export function createLLMRunner<M extends Modality = never>(
  modelPath: string,
  tokenizerPath: string,
  modalities?: readonly M[]
): LLMRunner<M> {
  'worklet';
  return rnexecutorchJsi.llm.createLLMRunner(modelPath, tokenizerPath, modalities ?? []);
}
