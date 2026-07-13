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

/** Handle to a native ExecuTorch text LLM runner. */
export type LLMRunner = {
  /** Path to the local model file. */
  readonly modelPath: string;

  /** Path to the local tokenizer configuration file. */
  readonly tokenizerPath: string;

  /** Disposes the native LLM runner and releases the loaded model memory. */
  dispose(): void;

  /**
   * Prefills the runner with a prompt to build up the KV cache.
   * @param prompt The prefill text prompt.
   */
  prefill(prompt: string): void;

  /** Interrupts and stops any active generation call on this runner. */
  stop(): void;

  /**
   * Generates text continuation from a prompt.
   * @param prompt The text prompt to generate continuation for.
   * @param config Generation configuration options.
   * @param onToken Callback function triggered whenever a new token is generated.
   * @returns Generation performance statistics.
   */
  generate(
    prompt: string,
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
 * Creates a native ExecuTorch Text LLM runner instance.
 * @param modelPath Path to the local .pte model file.
 * @param tokenizerPath Path to the local tokenizer configuration file (e.g. tokenizer.json).
 * @returns A native LLMRunner instance.
 */
export function createLLMRunner(modelPath: string, tokenizerPath: string): LLMRunner {
  'worklet';
  return rnexecutorchJsi.llm.createLLMRunner(modelPath, tokenizerPath) as LLMRunner;
}
