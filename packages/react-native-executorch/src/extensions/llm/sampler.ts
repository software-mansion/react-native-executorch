/**
 * LLM sampling pipeline — logit processors and samplers.
 *
 * The pipeline applies a sequence of {@link LogitProcessor}s to the raw logit
 * array, then passes the result to a {@link Sampler} to pick the next token.
 *
 * Standard built-in order (matches llama.cpp / HuggingFace conventions):
 *   repetition penalty → logit bias → temperature → top-k → top-p / min-p → sample
 *
 * Custom processors can be injected at the end of the chain via
 * {@link SamplingConfig.logitProcessors}, and the sampler can be replaced
 * entirely via {@link SamplingConfig.sampler}.
 */

// ── Types ───────────────────────────────────────────────────────────────────

/**
 * Contextual information available to logit processors during generation.
 * @category LLM / Types
 */
export type SamplingContext = {
  /** All token ids emitted so far in the current generation call. */
  readonly generatedTokens: readonly number[];
};

/**
 * Modifies a logit array **in-place** before sampling.
 * Multiple processors are applied sequentially in the order they are registered.
 * @category LLM / Types
 */
export type LogitProcessor = (logits: Float32Array, ctx: SamplingContext) => void;

/**
 * Picks a single next-token id from a (processed) logit array.
 *
 * Note: greedy and multinomial sampling are distinct algorithms, not
 * limit-cases of each other in practice. Greedy is a single-pass argmax —
 * exact and deterministic. Multinomial requires softmax + a random draw, and
 * even at very low temperatures, floating-point precision can cause it to
 * diverge from the true argmax near logit ties. Keep both; {@link buildSampler}
 * selects the right default based on {@link SamplingConfig.temperature}.
 * @category LLM / Types
 */
export type Sampler = (logits: Float32Array) => number;

/**
 * Configuration for the sampling pipeline.
 *
 * Shorthand fields (`temperature`, `topK`, …) are expanded into built-in
 * {@link LogitProcessor}s automatically by {@link buildSampler}.
 *
 * Set `temperature` to `0` (or leave it unset) for deterministic greedy
 * decoding. Set it to any positive value to enable stochastic multinomial
 * sampling.
 * @category LLM / Types
 */
export type SamplingConfig = {
  /**
   * Softmax temperature. Values below 1 sharpen the distribution (more
   * focused), values above 1 flatten it (more random). Set to 0 or omit for
   * greedy decoding.
   */
  readonly temperature?: number;
  /**
   * Keep only the `topK` highest-logit tokens; set the rest to `-Infinity`.
   * Applied after temperature scaling.
   */
  readonly topK?: number;
  /**
   * Nucleus sampling: keep the smallest set of tokens whose cumulative
   * probability (after softmax) is at least `topP`. Applied after temperature
   * and top-k. Values in `(0, 1]`.
   */
  readonly topP?: number;
  /**
   * Min-p sampling: keep tokens whose probability is at least `minP × p_max`,
   * where `p_max` is the highest token probability. Simpler and often more
   * robust than top-p. Applied after temperature and top-k. Values in `(0, 1]`.
   */
  readonly minP?: number;
  /**
   * Repetition penalty factor (> 1 penalizes repetition, 1 = no effect).
   * Logits of already-generated tokens are divided (if positive) or multiplied
   * (if negative) by this value. Applied before temperature.
   */
  readonly repetitionPenalty?: number;
  /**
   * Fixed logit offsets keyed by token id. Positive values boost a token,
   * negative values suppress it. Use `-Infinity` to completely ban a token.
   * Applied before temperature.
   */
  readonly logitBias?: ReadonlyMap<number, number>;
  /**
   * Additional {@link LogitProcessor}s appended after all built-in ones.
   * Use this for constrained decoding (grammar, JSON schema, regex, …).
   */
  readonly logitProcessors?: readonly LogitProcessor[];
  /**
   * Custom sampler. When omitted, defaults to {@link greedySampler} if
   * `temperature` is 0 or unset, and {@link multinomialSampler} otherwise.
   */
  readonly sampler?: Sampler;
};

/**
 * Compiled sampling pipeline, ready to be used in a generation loop.
 * @category LLM / Types
 */
export type SamplingPipeline = {
  readonly processors: readonly LogitProcessor[];
  readonly sampler: Sampler;
};

// ── Internal utilities ───────────────────────────────────────────────────────

/**
 * Computes softmax of `logits` into `out` in-place.
 * Numerically stable via max subtraction. `-Infinity` logits contribute 0.
 * @param logits Source logit array.
 * @param out Destination probability array (same length as `logits`).
 */
function softmax(logits: Float32Array, out: Float32Array): void {
  'worklet';
  let max = -Infinity;
  for (let i = 0; i < logits.length; i++) {
    if (logits[i]! > max) max = logits[i]!;
  }
  let sum = 0;
  for (let i = 0; i < logits.length; i++) {
    out[i] = Math.exp(logits[i]! - max);
    sum += out[i]!;
  }
  for (let i = 0; i < logits.length; i++) {
    out[i]! /= sum;
  }
}

// ── Built-in logit processors ────────────────────────────────────────────────

/**
 * Scales logits by `1 / temperature`. Steers the distribution toward the
 * peak (temperature < 1) or away from it (temperature > 1).
 * @param temperature Scaling factor (must be > 0).
 * @returns A {@link LogitProcessor} that applies the temperature scale.
 * @category LLM / Functions
 */
export function temperatureProcessor(temperature: number): LogitProcessor {
  return (logits) => {
    'worklet';
    for (let i = 0; i < logits.length; i++) {
      logits[i]! /= temperature;
    }
  };
}

/**
 * Keeps only the `k` tokens with the highest logits; all others are set to
 * `-Infinity`. Pass `Infinity` to disable.
 * @param k Number of top tokens to keep.
 * @returns A {@link LogitProcessor} that applies top-k masking.
 * @category LLM / Functions
 */
export function topKProcessor(k: number): LogitProcessor {
  return (logits) => {
    'worklet';
    if (k <= 0 || k >= logits.length) return;
    // Sort a copy ascending; the k-th largest is at index (n - k).
    const sorted = logits.slice().sort();
    const threshold = sorted[sorted.length - k]!;
    for (let i = 0; i < logits.length; i++) {
      if (logits[i]! < threshold) logits[i] = -Infinity;
    }
  };
}

/**
 * Nucleus (top-p) sampling: keeps the smallest set of tokens whose cumulative
 * softmax probability is at least `p`, then masks the rest to `-Infinity`.
 * Must be applied **after** temperature scaling.
 * @param p Cumulative probability threshold, in `(0, 1]`.
 * @returns A {@link LogitProcessor} that applies nucleus masking.
 * @category LLM / Functions
 */
export function topPProcessor(p: number): LogitProcessor {
  return (logits) => {
    'worklet';
    const n = logits.length;
    const probs = new Float32Array(n);
    softmax(logits, probs);

    // Build index array sorted by probability descending.
    const indices = Array.from({ length: n }, (_, i) => i);
    indices.sort((a, b) => probs[b]! - probs[a]!);

    // Walk until cumulative probability >= p; mark everything else as masked.
    const keep = new Uint8Array(n);
    let cumProb = 0;
    for (const idx of indices) {
      keep[idx] = 1;
      cumProb += probs[idx]!;
      if (cumProb >= p) break;
    }

    for (let i = 0; i < n; i++) {
      if (!keep[i]) logits[i] = -Infinity;
    }
  };
}

/**
 * Min-p sampling: keeps tokens whose probability is at least `minP × p_max`,
 * where `p_max` is the maximum token probability after softmax. Simpler and
 * often more robust than top-p. Must be applied **after** temperature scaling.
 * @param minP Minimum probability ratio relative to the top token, in `(0, 1]`.
 * @returns A {@link LogitProcessor} that applies min-p masking.
 * @category LLM / Functions
 */
export function minPProcessor(minP: number): LogitProcessor {
  return (logits) => {
    'worklet';
    const n = logits.length;
    const probs = new Float32Array(n);
    softmax(logits, probs);

    let maxProb = 0;
    for (let i = 0; i < n; i++) {
      if (probs[i]! > maxProb) maxProb = probs[i]!;
    }

    const threshold = minP * maxProb;
    for (let i = 0; i < n; i++) {
      if (probs[i]! < threshold) logits[i] = -Infinity;
    }
  };
}

/**
 * Applies a repetition penalty to already-generated tokens. Positive logits
 * are divided by `penalty`; negative logits are multiplied, so the penalty
 * always pushes logits toward 0 (less likely). `penalty` must be > 1 to have
 * any effect.
 * @param penalty Penalty factor (must be > 1 to penalize repetition).
 * @returns A {@link LogitProcessor} that applies the repetition penalty.
 * @category LLM / Functions
 */
export function repetitionPenaltyProcessor(penalty: number): LogitProcessor {
  return (logits, ctx) => {
    'worklet';
    for (const token of ctx.generatedTokens) {
      const logit = logits[token];
      if (logit === undefined) continue;
      logits[token] = logit > 0 ? logit / penalty : logit * penalty;
    }
  };
}

/**
 * Adds fixed offsets to specific token logits. Positive values boost a token,
 * negative values suppress it. Pass `-Infinity` to ban a token entirely.
 * @param bias Map from token id to logit offset.
 * @returns A {@link LogitProcessor} that applies the logit bias.
 * @category LLM / Functions
 */
export function logitBiasProcessor(bias: ReadonlyMap<number, number>): LogitProcessor {
  return (logits) => {
    'worklet';
    for (const [token, value] of bias) {
      if (token >= 0 && token < logits.length) {
        logits[token]! += value;
      }
    }
  };
}

// ── Built-in samplers ────────────────────────────────────────────────────────

/**
 * Returns the token with the highest logit (argmax). Deterministic and ~3×
 * faster than {@link multinomialSampler} since it requires no softmax.
 * @returns A {@link Sampler} that picks the argmax token.
 * @category LLM / Functions
 */
export function greedySampler(): Sampler {
  return (logits) => {
    'worklet';
    let best = 0;
    let bestVal = -Infinity;
    for (let i = 0; i < logits.length; i++) {
      if (logits[i]! > bestVal) {
        bestVal = logits[i]!;
        best = i;
      }
    }
    return best;
  };
}

/**
 * Samples a token from the softmax probability distribution of the (processed)
 * logits. Non-deterministic; use with a positive `temperature`.
 *
 * Although greedy decoding is the `temperature → 0` limit of multinomial
 * sampling in theory, floating-point precision near logit ties makes
 * {@link greedySampler} the correct choice for deterministic inference.
 * @returns A {@link Sampler} that draws from the softmax distribution.
 * @category LLM / Functions
 */
export function multinomialSampler(): Sampler {
  return (logits) => {
    'worklet';
    const n = logits.length;
    const probs = new Float32Array(n);
    softmax(logits, probs);

    const r = Math.random();
    let cumProb = 0;
    for (let i = 0; i < n; i++) {
      cumProb += probs[i]!;
      if (r <= cumProb) return i;
    }
    return n - 1;
  };
}

// ── Pipeline builder ─────────────────────────────────────────────────────────

/**
 * Builds a {@link SamplingPipeline} from a {@link SamplingConfig}.
 *
 * Built-in processors are registered in this order:
 * 1. Repetition penalty
 * 2. Logit bias
 * 3. Temperature
 * 4. Top-k
 * 5. Top-p
 * 6. Min-p
 * 7. Custom `logitProcessors` (appended last — ideal for constrained decoding)
 *
 * The sampler defaults to {@link greedySampler} when `temperature` is 0 or
 * unset, and {@link multinomialSampler} otherwise.
 * @param config Sampling configuration.
 * @returns A compiled {@link SamplingPipeline}.
 * @category LLM / Functions
 */
export function buildSampler(config?: SamplingConfig): SamplingPipeline {
  const processors: LogitProcessor[] = [];

  if (config?.repetitionPenalty !== undefined && config.repetitionPenalty !== 1) {
    processors.push(repetitionPenaltyProcessor(config.repetitionPenalty));
  }
  if (config?.logitBias !== undefined && config.logitBias.size > 0) {
    processors.push(logitBiasProcessor(config.logitBias));
  }

  const temperature = config?.temperature ?? 0;
  const stochastic = temperature > 0;

  if (stochastic) {
    processors.push(temperatureProcessor(temperature));
  }
  if (config?.topK !== undefined) {
    processors.push(topKProcessor(config.topK));
  }
  if (config?.topP !== undefined) {
    processors.push(topPProcessor(config.topP));
  }
  if (config?.minP !== undefined) {
    processors.push(minPProcessor(config.minP));
  }
  for (const p of config?.logitProcessors ?? []) {
    processors.push(p);
  }

  const sampler = config?.sampler ?? (stochastic ? multinomialSampler() : greedySampler());

  return { processors, sampler };
}

/**
 * Applies `pipeline.processors` to `logits` in-place, then calls
 * `pipeline.sampler` to pick the next token. Convenience wrapper for the
 * generation loop.
 * @param logits Raw logit array from the model (modified in-place).
 * @param pipeline Compiled {@link SamplingPipeline} from {@link buildSampler}.
 * @param ctx Contextual information for processors that need generation history.
 * @returns The sampled token id.
 * @category LLM / Functions
 */
export function runSampling(
  logits: Float32Array,
  pipeline: SamplingPipeline,
  ctx: SamplingContext
): number {
  'worklet';
  for (const p of pipeline.processors) p(logits, ctx);
  return pipeline.sampler(logits);
}
