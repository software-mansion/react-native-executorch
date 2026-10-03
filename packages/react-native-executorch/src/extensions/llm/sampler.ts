/**
 * LLM generation sampling pipeline and logit processors.
 */

import { multinomial } from '../math';

/**
 * Contextual information available to logit processors during generation.
 * @category LLM / Types
 */
export type SamplingContext = {
  /** All token ids emitted so far in the current generation call. */
  readonly generatedTokens: readonly number[];
};

/**
 * Modifies a logit array in-place before token selection.
 * @category LLM / Types
 */
export type LogitProcessor = (logits: Float32Array, ctx: SamplingContext) => void;

/**
 * Selects a token id from a processed logit distribution.
 * @category LLM / Types
 */
export type TokenSelector = (logits: Float32Array) => number;

/**
 * Samples the next token id given raw logits and generation context.
 * @category LLM / Types
 */
export type Sampler = (logits: Float32Array, ctx: SamplingContext) => number;

/**
 * Configuration options for LLM token sampling.
 * @category LLM / Types
 */
export type SamplingConfig = {
  /**
   * Sampling temperature. Values below 1 sharpen the distribution, while values
   * above 1 flatten it. Defaults to greedy decoding when unset or set to 0.
   */
  readonly temperature?: number;
  /** Number of highest-probability tokens to retain. */
  readonly topK?: number;
  /** Cumulative probability threshold for nucleus sampling, in `(0, 1]`. */
  readonly topP?: number;
  /** Minimum token probability relative to the most likely token, in `(0, 1]`. */
  readonly minP?: number;
  /** Penalty applied to previously generated tokens. Values greater than 1 discourage repetition. */
  readonly repetitionPenalty?: number;
  /** Additive logit offsets keyed by token id. */
  readonly logitBias?: ReadonlyMap<number, number>;
  /** Custom logit processors applied after standard processors. */
  readonly logitProcessors?: readonly LogitProcessor[];
  /** Custom token selector overriding greedy or multinomial sampling. */
  readonly selector?: TokenSelector;
};

/**
 * Inserts a value into a sorted array maintaining ascending order.
 * @param arr Target sorted array.
 * @param val Value to insert.
 */
function insertSorted(arr: number[], val: number): void {
  'worklet';
  let [lo, hi] = [0, arr.length];
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid]! < val) lo = mid + 1;
    else hi = mid;
  }
  arr.splice(lo, 0, val);
}

/**
 * Scales logits by the inverse temperature factor.
 * @param temperature Sampling temperature.
 * @returns A logit processor that applies temperature scaling.
 * @category LLM / Functions
 */
export function temperatureProcessor(temperature: number): LogitProcessor {
  'worklet';
  return (logits) => {
    'worklet';
    for (let i = 0; i < logits.length; i++) {
      logits[i]! /= temperature;
    }
  };
}

/**
 * Retains only the top-k highest logits and masks the rest to `-Infinity`.
 * @param k Number of top tokens to keep.
 * @returns A logit processor that applies top-k filtering.
 * @category LLM / Functions
 */
export function topKProcessor(k: number): LogitProcessor {
  'worklet';
  return (logits) => {
    'worklet';
    if (k <= 0 || k >= logits.length) return;

    const top: number[] = [];
    for (let i = 0; i < logits.length; i++) {
      const val = logits[i]!;
      if (top.length < k) {
        insertSorted(top, val);
      } else if (val > top[0]!) {
        top.shift();
        insertSorted(top, val);
      }
    }

    const threshold = top[0]!;
    for (let i = 0; i < logits.length; i++) {
      if (logits[i]! < threshold) {
        logits[i] = -Infinity;
      }
    }
  };
}

/**
 * Applies nucleus (top-p) filtering, retaining tokens up to cumulative probability `p`.
 * @param p Cumulative probability threshold.
 * @returns A logit processor that applies top-p filtering.
 * @category LLM / Functions
 */
export function topPProcessor(p: number): LogitProcessor {
  'worklet';
  return (logits) => {
    'worklet';
    if (p <= 0 || p >= 1) return;

    let maxLogit = -Infinity;
    for (let i = 0; i < logits.length; i++) {
      if (logits[i]! > maxLogit) {
        maxLogit = logits[i]!;
      }
    }
    if (!Number.isFinite(maxLogit)) return;

    const minLogitThreshold = maxLogit - 16;
    let totalWeight = 0;
    const candidates: number[] = [];

    for (let i = 0; i < logits.length; i++) {
      const val = logits[i]!;
      if (val > minLogitThreshold) {
        totalWeight += Math.exp(val - maxLogit);
        candidates.push(i);
      } else {
        logits[i] = -Infinity;
      }
    }

    if (candidates.length > 512) {
      candidates.sort((a, b) => logits[b]! - logits[a]!);
      for (let i = 512; i < candidates.length; i++) {
        logits[candidates[i]!] = -Infinity;
      }
      candidates.length = 512;
    } else {
      candidates.sort((a, b) => logits[b]! - logits[a]!);
    }

    const targetWeight = p * totalWeight;
    let cumWeight = 0;
    let cutoff = candidates.length - 1;

    for (let i = 0; i < candidates.length; i++) {
      const idx = candidates[i]!;
      cumWeight += Math.exp(logits[idx]! - maxLogit);
      if (cumWeight >= targetWeight) {
        cutoff = i;
        break;
      }
    }

    for (let i = cutoff + 1; i < candidates.length; i++) {
      logits[candidates[i]!] = -Infinity;
    }
  };
}

/**
 * Filters out tokens whose probability is below `minP` times the top token's probability.
 * @param minP Minimum relative probability threshold.
 * @returns A logit processor that applies min-p filtering.
 * @category LLM / Functions
 */
export function minPProcessor(minP: number): LogitProcessor {
  'worklet';
  return (logits) => {
    'worklet';
    if (minP <= 0) return;
    let maxLogit = -Infinity;
    for (let i = 0; i < logits.length; i++) {
      if (logits[i]! > maxLogit) {
        maxLogit = logits[i]!;
      }
    }
    if (!Number.isFinite(maxLogit)) return;

    const threshold = maxLogit + Math.log(minP);
    for (let i = 0; i < logits.length; i++) {
      if (logits[i]! < threshold) {
        logits[i] = -Infinity;
      }
    }
  };
}

/**
 * Penalizes logits of previously emitted tokens to discourage repetition.
 * @param penalty Multiplicative penalty factor.
 * @returns A logit processor that penalizes repeated tokens.
 * @category LLM / Functions
 */
export function repetitionPenaltyProcessor(penalty: number): LogitProcessor {
  'worklet';
  return (logits, ctx) => {
    'worklet';
    if (penalty === 1 || ctx.generatedTokens.length === 0) return;
    const seen = new Set<number>();
    for (const token of ctx.generatedTokens) {
      if (seen.has(token)) continue;
      seen.add(token);
      const logit = logits[token];
      if (logit !== undefined) {
        logits[token] = logit > 0 ? logit / penalty : logit * penalty;
      }
    }
  };
}

/**
 * Applies additive biases to specific token logits.
 * @param bias Map from token id to additive logit offset.
 * @returns A logit processor that applies the offsets.
 * @category LLM / Functions
 */
export function logitBiasProcessor(bias: ReadonlyMap<number, number>): LogitProcessor {
  'worklet';
  return (logits) => {
    'worklet';
    for (const [token, value] of bias) {
      if (token >= 0 && token < logits.length) {
        logits[token]! += value;
      }
    }
  };
}

/**
 * Selects the token with the highest logit.
 * @returns A deterministic greedy token selector.
 * @category LLM / Functions
 */
export function greedySelector(): TokenSelector {
  'worklet';
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
 * Draws a token from the categorical probability distribution of logits.
 * @param rng Optional custom uniform random number generator producing values in `[0, 1)`.
 * @returns A stochastic multinomial token selector.
 * @category LLM / Functions
 */
export function multinomialSelector(rng?: () => number): TokenSelector {
  'worklet';
  return (logits) => {
    'worklet';
    return multinomial(logits, { rng });
  };
}

/**
 * Creates a sampler function configured from generation options.
 * @param config Sampling configuration.
 * @returns A {@link Sampler} function.
 * @category LLM / Functions
 */
export function createSampler(config?: SamplingConfig): Sampler {
  'worklet';
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
  if (config?.logitProcessors) {
    for (const processor of config.logitProcessors) {
      processors.push(processor);
    }
  }

  const selector = config?.selector ?? (stochastic ? multinomialSelector() : greedySelector());

  return (logits: Float32Array, ctx: SamplingContext): number => {
    'worklet';
    for (const processor of processors) {
      processor(logits, ctx);
    }
    return selector(logits);
  };
}
