/**
 * LLM generation sampling types and native sampler bridge function.
 */

import { rnexecutorchJsi } from '../../native/bridge';
import type { Tensor } from '../../core/tensor';

/**
 * Contextual information available to constraint callbacks and sampling
 * strategies during generation.
 * @category LLM / Types
 */
export type SamplingContext = {
  /** All token ids emitted so far in the current generation call. */
  readonly generatedTokens: Int32Array;
};

/**
 * Constraints returned by a {@link SamplingConstraintsCallback} to constrain token
 * selection.
 * @category LLM / Types
 */
export type SamplingConstraints = {
  /**
   * If specified, only these tokens are allowed. All other token logits are
   * masked to `-Infinity`.
   */
  readonly allowedTokens?: Int32Array;
  /**
   * If specified, these tokens are forbidden. Their logits are masked to
   * `-Infinity`.
   */
  readonly bannedTokens?: Int32Array;
};

/**
 * Callback invoked before token selection to dynamically apply token constraints.
 * @param ctx Generation context containing emitted tokens.
 * @returns Constraints specifying allowed or banned tokens.
 * @category LLM / Types
 */
export type SamplingConstraintsCallback = (ctx: SamplingContext) => SamplingConstraints | undefined;

/**
 * Configuration options for Don't Repeat Yourself (DRY) repetition penalty.
 *
 * Penalizes tokens that would extend an already repeated n-gram sequence.
 * @category LLM / Types
 */
export type DryConfig = {
  /**
   * Multiplier penalty factor (e.g. 0.8). Set to 0 to disable.
   */
  readonly multiplier: number;
  /**
   * Exponential penalty base. Defaults to 1.75.
   */
  readonly base?: number;
  /**
   * Minimum match length before penalty is applied. Defaults to 2.
   */
  readonly allowedLength?: number;
  /**
   * Maximum number of recent tokens to consider (window). Defaults to -1
   * (entire context).
   */
  readonly penaltyLastN?: number;
  /**
   * Sequence-breaking token IDs (e.g. newlines) that reset n-gram matching.
   */
  readonly sequenceBreakers?: Int32Array;
};

/**
 * Configuration options for Exclude Top Choices (XTC) sampling.
 * @category LLM / Types
 */
export type XTCConfig = {
  /**
   * Probability of excluding the top choice when multiple candidates meet the
   * threshold, in `[0, 1]`. Required: it is the knob that turns XTC on, so it
   * has no default — a `0` default would make an enabled `xtc` a silent no-op.
   */
  readonly probability: number;
  /**
   * Probability threshold for plausible tokens, in `[0, 0.5]`. Defaults to 0.1.
   */
  readonly threshold?: number;
};

/**
 * Configuration options for LLM token sampling.
 * @category LLM / Types
 */
export type SamplingConfig = {
  /**
   * Sampling temperature. Values below 1 sharpen the distribution, while values
   * above 1 flatten it. Set to 0 for greedy decoding. Defaults to 0.8.
   */
  readonly temperature?: number;
  /** Number of highest-probability tokens to retain, `>= 1`. Use `1` for greedy decoding. Defaults to 40. */
  readonly topK?: number;
  /** Cumulative probability threshold for nucleus sampling, in `(0, 1]`. Defaults to 0.95. */
  readonly topP?: number;
  /** Minimum token probability relative to the most likely token, in `[0, 1)`. Defaults to 0.05. */
  readonly minP?: number;
  /**
   * Penalty applied to previously generated tokens. Values greater than 1
   * discourage repetition. Defaults to 1.0 (disabled).
   */
  readonly repetitionPenalty?: number;
  /** Configuration for Don't Repeat Yourself (DRY) repetition penalty. */
  readonly dry?: DryConfig;
  /** Configuration for Exclude Top Choices (XTC) sampling. */
  readonly xtc?: XTCConfig;
  /**
   * Optional callback for dynamic token constraints and guided decoding (e.g.
   * JSON schemas, grammars, choice whitelists, stop tokens).
   */
  readonly constraints?: SamplingConstraintsCallback;
};

// Defaults mirror llama.cpp's `common_params_sampling` and are resolved here so
// the native sampler receives a fully-specified options object and treats every
// field as required.

const EMPTY_SEQUENCE_BREAKERS = new Int32Array(0);

const DEFAULT_SAMPLING_OPTIONS = {
  temperature: 0.8,
  repetitionPenalty: 1.0,
  topK: 40,
  topP: 0.95,
  minP: 0.05,
} as const;

const DEFAULT_DRY_OPTIONS = {
  base: 1.75,
  allowedLength: 2,
  penaltyLastN: -1,
  sequenceBreakers: EMPTY_SEQUENCE_BREAKERS,
} as const;

const DEFAULT_XTC_OPTIONS = {
  threshold: 0.1,
} as const;

/**
 * Samples a token directly from a native logits tensor given generation context and config.
 *
 * **Important:** The logits buffer is written to in place (penalties, DRY and constraints are
 * applied directly to it), so its contents are undefined after this call. Copy
 * the tensor first if the original logits are still needed.
 * @param logits 2D float32 logits Tensor of shape `[1, vocabSize]`. Clobbered by the call.
 * @param ctx Generation context containing emitted token history.
 * @param config Optional sampling configuration (defaults to `{}`).
 * @returns The sampled token id.
 * @throws {RnExecuTorchError} With code `RESOURCE_BUSY` if the logits tensor is
 * locked by another thread, or `INVALID_ARGUMENT` if the options are out of range.
 * @category LLM / Functions
 */
export function sample(logits: Tensor, ctx: SamplingContext, config: SamplingConfig = {}): number {
  'worklet';
  const options = {
    ...DEFAULT_SAMPLING_OPTIONS,
    ...config,
    dry: config.dry && { ...DEFAULT_DRY_OPTIONS, ...config.dry },
    xtc: config.xtc && { ...DEFAULT_XTC_OPTIONS, ...config.xtc },
  };
  return rnexecutorchJsi.llm.sample(logits, ctx, options);
}
