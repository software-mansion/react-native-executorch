/**
 * Low-level native ExecuTorch LLM runner types and factory.
 */

import { type WorkletRuntime } from 'react-native-worklets';

import type { Tensor } from '../../core/tensor';
import { wrapAsync } from '../../core/runtime';
import { loadModel } from '../../core/model';
import { RnExecuTorchError } from '../../core/error';
import { createResourceScope } from '../../core/lifetime';
import { validateSpec } from '../../core/schema';

import { loadTokenizer } from '../nlp';

import type { SamplingConfig } from './sampler';
import { createLLMTextRunner, LLM_TEXT_RUNNER_SPEC } from './runners/llmTextRunner';
import {
  createLLMMultimodalRunner,
  LLM_MULTIMODAL_RUNNER_SPEC,
} from './runners/llmMultimodalRunner';

declare const llmRunnerBrand: unique symbol;

/**
 * Configuration options for LLM text generation.
 * @experimental This API is experimental and might change in future releases.
 * @category LLM / Types
 */
export type LLMGenerationConfig = SamplingConfig & {
  /** Whether to ignore EOS tokens during generation. */
  readonly ignoreEos?: boolean;
  /** Maximum number of new tokens to generate. */
  readonly maxNewTokens?: number;
};

/**
 * Execution and performance statistics for a prefill phase.
 * @experimental This API is experimental and might change in future releases.
 * @category LLM / Types
 */
export type LLMPrefillStats = {
  /** Number of tokens processed during prefill. */
  readonly numTokens: number;
  /** Duration in milliseconds spent in prefill. */
  readonly durationMs: number;
  /** Prefill throughput in tokens per second. */
  readonly tokensPerSecond: number;
};

/**
 * Execution and performance statistics for a generation call.
 * @experimental This API is experimental and might change in future releases.
 * @category LLM / Types
 */
export type LLMGenerationStats = {
  /** Number of newly generated tokens. */
  readonly numTokens: number;
  /** Duration in milliseconds spent in decode generation. */
  readonly durationMs: number;
  /** Generation throughput in tokens per second. */
  readonly tokensPerSecond: number;
  /** Performance statistics of the prefill phase. */
  readonly prefill: LLMPrefillStats;
};

/**
 * Low-level non-text media input tensor payloads.
 * @experimental This API is experimental and might change in future releases.
 * @category LLM / Types
 */
export type MediaInput =
  | { readonly kind: 'image'; readonly image: Tensor }
  | { readonly kind: 'audio'; readonly audio: Tensor };

/**
 * Supported non-text input modality keys (e.g. `'image'`, `'audio'`).
 * @experimental This API is experimental and might change in future releases.
 * @category LLM / Types
 */
export type Modality = MediaInput['kind'];

/**
 * Text or interleaved multimodal prompt input for a low-level LLM runner.
 * @experimental This API is experimental and might change in future releases.
 * @category LLM / Types
 */
export type Prompt = string | readonly (string | MediaInput)[];

/**
 * Current KV cache state and capacity metrics for an LLM runner.
 * @experimental This API is experimental and might change in future releases.
 * @category LLM / Types
 */
export type LLMKVCacheState = {
  /** Current token position index / number of occupied tokens in the KV cache. */
  readonly pos: number;
  /** Maximum token capacity (context window) supported by the model. */
  readonly maxContextLen: number;
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
 * @category LLM / Types
 */
export type LLMRunner = {
  /** Path to the local model file. */
  readonly modelPath: string;
  /** Path to the local tokenizer configuration file. */
  readonly tokenizerPath: string;
  /** List of supported non-text input modalities for this runner (e.g. `['image']`). */
  readonly modalities: readonly Modality[];

  /**
   * Releases all allocated native resources.
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
   * @returns Prefill performance statistics.
   */
  prefill(prompt: Prompt): LLMPrefillStats;

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
 * @category LLM / Functions
 * @param modelPath Path to the local `.pte` model file.
 * @param tokenizerPath Path to the local tokenizer configuration file (e.g. `tokenizer.json`).
 * @param modalities List of supported input non-text modalities (e.g.
 * `['image']`). When omitted, defaults to text-only.
 * @param runtime ...
 * @returns A native {@link LLMRunner} instance.
 */
export async function createLLMRunner(
  modelPath: string,
  tokenizerPath: string,
  modalities?: readonly Modality[],
  runtime?: WorkletRuntime
): Promise<LLMRunner> {
  const scope = createResourceScope();
  try {
    const model = scope.track(await wrapAsync(loadModel, runtime)(modelPath));
    const tokenizer = scope.track(await wrapAsync(loadTokenizer, runtime)(tokenizerPath));

    const { variant, dims } = validateSpec(model.schema, {
      text: LLM_TEXT_RUNNER_SPEC,
      vision: LLM_MULTIMODAL_RUNNER_SPEC,
    });

    switch (variant) {
      case 'text':
        return createLLMTextRunner(model, tokenizer, dims, modalities);
      case 'vision':
        return createLLMMultimodalRunner(model, tokenizer, dims, modalities);
      default:
        throw RnExecuTorchError('LOAD_FAILED', `llmRunner: unrecognized variant ${variant}`);
    }
  } catch (e) {
    scope.dispose();
    throw e;
  }
}
