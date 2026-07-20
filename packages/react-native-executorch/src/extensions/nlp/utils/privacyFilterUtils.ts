// Privacy-filter-specific helpers: BIOES grammar construction and constrained
// Viterbi decoding over per-token logits, plus span extraction. These live
// under `utils/` (not the shared `ops.ts`) because they are only meaningful to
// the privacy filter pipeline. The transformer forward pass dominates the
// inference budget, so this decoding is written in pure TypeScript rather than
// a native op (see the `add-native-extension` skill's Amdahl's-law rule).

const NEG_INF = -1e30;

/**
 * Six Viterbi transition biases matching the openai/privacy-filter
 * `viterbi_calibration.json` schema. Each value is added to the decoder score
 * whenever the corresponding BIOES transition is taken. Positive values
 * encourage the transition; negative values discourage it. Every field
 * defaults to `0` (a neutral, validity-only Viterbi).
 * @category Types
 */
export interface ViterbiBiases {
  /** `O -> O` (background persistence). Higher = stay in background more, fewer false positives. */
  readonly backgroundStay?: number;
  /** `O -> B-x`/`S-x` (span entry). Lower (negative) = enter spans more eagerly, higher recall. */
  readonly backgroundToStart?: number;
  /** `E-x`/`S-x` `-> O` (span closure to background). */
  readonly endToBackground?: number;
  /** `E-x`/`S-x` `-> B-y`/`S-y` (back-to-back spans). */
  readonly endToStart?: number;
  /** `B-x`/`I-x` `-> I-x` (span continuation). Higher = longer spans. */
  readonly insideToContinue?: number;
  /** `B-x`/`I-x` `-> E-x` (span closure). Higher = shorter spans. */
  readonly insideToEnd?: number;
}

/**
 * A single detected PII entity span.
 * @category Types
 */
export interface PiiEntity {
  /** Entity type, e.g. `private_person`, `private_email`, `secret`. */
  readonly label: string;
  /** Decoded text of the span (whitespace trimmed). */
  readonly text: string;
  /** Inclusive start token index in the original (unpadded) tokenization. */
  readonly startToken: number;
  /** Exclusive end token index. */
  readonly endToken: number;
}

/**
 * Pre-computed BIOES grammar tables consumed by {@link viterbiDecode}.
 *
 * `transitionScore[i * numLabels + j]` holds the bias for a valid `i -> j`
 * transition, or `-inf` for an invalid one (so the inner loop can skip it with
 * a single comparison). `validStart[j]` is `true` iff label `j` is a legal
 * first-token label (`O`, `B-x`, or `S-x`).
 * @category Types
 */
export interface Grammar {
  readonly transitionScore: Float32Array;
  readonly validStart: boolean[];
  readonly numLabels: number;
}

interface LabelRole {
  readonly prefix: string; // 'O' | 'B' | 'I' | 'E' | 'S'
  readonly entity: string;
}

function classifyLabel(name: string): LabelRole {
  if (name === 'O' || name.length === 0) return { prefix: 'O', entity: '' };
  if (name.length < 2 || name[1] !== '-') return { prefix: 'O', entity: '' };
  return { prefix: name[0]!, entity: name.slice(2) };
}

// BIOES grammar:
//   O / E-X / S-X -> O | B-* | S-*
//   B-X / I-X     -> I-X | E-X  (same entity type)
function isValidTransition(prev: LabelRole, next: LabelRole): boolean {
  if (prev.prefix === 'O' || prev.prefix === 'E' || prev.prefix === 'S') {
    return next.prefix === 'O' || next.prefix === 'B' || next.prefix === 'S';
  }
  if (prev.prefix === 'B' || prev.prefix === 'I') {
    return (next.prefix === 'I' || next.prefix === 'E') && next.entity === prev.entity;
  }
  return false;
}

function biasFor(prev: LabelRole, next: LabelRole, b: Required<ViterbiBiases>): number {
  if (prev.prefix === 'O' && next.prefix === 'O') return b.backgroundStay;
  if (prev.prefix === 'O' && (next.prefix === 'B' || next.prefix === 'S'))
    return b.backgroundToStart;
  if ((prev.prefix === 'E' || prev.prefix === 'S') && next.prefix === 'O') return b.endToBackground;
  if ((prev.prefix === 'E' || prev.prefix === 'S') && (next.prefix === 'B' || next.prefix === 'S'))
    return b.endToStart;
  if ((prev.prefix === 'B' || prev.prefix === 'I') && next.prefix === 'I')
    return b.insideToContinue;
  if ((prev.prefix === 'B' || prev.prefix === 'I') && next.prefix === 'E') return b.insideToEnd;
  return 0;
}

/**
 * Builds the fused BIOES transition/validity tables for a label space. Called
 * once at pipeline construction (not on the worklet thread), so the per-token
 * decode loop only reads the pre-computed {@link Grammar}.
 * @param labelNames BIOES label list; index 0 must be `'O'`.
 * @param biases Optional transition biases; missing fields default to `0`.
 * @returns The pre-computed grammar tables.
 */
export function buildGrammar(labelNames: readonly string[], biases?: ViterbiBiases): Grammar {
  const resolved: Required<ViterbiBiases> = {
    backgroundStay: biases?.backgroundStay ?? 0,
    backgroundToStart: biases?.backgroundToStart ?? 0,
    endToBackground: biases?.endToBackground ?? 0,
    endToStart: biases?.endToStart ?? 0,
    insideToContinue: biases?.insideToContinue ?? 0,
    insideToEnd: biases?.insideToEnd ?? 0,
  };

  const n = labelNames.length;
  const roles = labelNames.map(classifyLabel);

  // transitionScore[i*n + j]: bias for valid transitions, -inf for invalid.
  const transitionScore = new Float32Array(n * n).fill(NEG_INF);
  const validStart: boolean[] = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    const prev = roles[i]!;
    validStart[i] = prev.prefix === 'O' || prev.prefix === 'B' || prev.prefix === 'S';
    for (let j = 0; j < n; j++) {
      if (isValidTransition(prev, roles[j]!)) {
        transitionScore[i * n + j] = biasFor(prev, roles[j]!, resolved);
      }
    }
  }

  return { transitionScore, validStart, numLabels: n };
}

/**
 * Runs constrained Viterbi over a `[validLen, numLabels]` slice of per-token
 * logits and returns the best BIOES-grammar-valid label-id sequence (length
 * `validLen`).
 * @param logits Flat row-major logits; row `t` starts at `t * numLabels`.
 * @param validLen Number of leading token rows to decode.
 * @param grammar Pre-computed grammar tables from {@link buildGrammar}.
 * @returns The most likely label id per token.
 */
export function viterbiDecode(
  logits: Float32Array,
  validLen: number,
  grammar: Grammar
): Int32Array {
  'worklet';
  const n = grammar.numLabels;
  if (validLen <= 0) return new Int32Array(0);

  const trans = grammar.transitionScore;
  let dp = new Float32Array(n);
  let dpNext = new Float32Array(n);
  // bp[t*n + j]: best predecessor of label j at step t. Row 0 is unused
  // (traceback starts at t = 1).
  const bp = new Int32Array(validLen * n);

  for (let j = 0; j < n; j++) {
    dp[j] = grammar.validStart[j] ? logits[j]! : NEG_INF;
  }

  for (let t = 1; t < validLen; t++) {
    const rowOffset = t * n;
    for (let j = 0; j < n; j++) {
      let best = NEG_INF;
      let bestPrev = 0;
      for (let i = 0; i < n; i++) {
        const tr = trans[i * n + j]!;
        if (tr <= NEG_INF / 2) continue;
        const candidate = dp[i]! + tr;
        if (candidate > best) {
          best = candidate;
          bestPrev = i;
        }
      }
      dpNext[j] = best === NEG_INF ? NEG_INF : best + logits[rowOffset + j]!;
      bp[rowOffset + j] = bestPrev;
    }
    const swap = dp;
    dp = dpNext;
    dpNext = swap;
  }

  let bestEnd = 0;
  let bestScore = dp[0]!;
  for (let j = 1; j < n; j++) {
    if (dp[j]! > bestScore) {
      bestScore = dp[j]!;
      bestEnd = j;
    }
  }

  const path = new Int32Array(validLen);
  path[validLen - 1] = bestEnd;
  for (let t = validLen - 1; t > 0; t--) {
    path[t - 1] = bp[t * n + path[t]!]!;
  }
  return path;
}

/**
 * Maps a BIOES label id to its bare entity type (the part after the `-`), or
 * an empty string for `O` / unprefixed / out-of-range ids.
 * @param labelId Predicted label id.
 * @param labelNames The BIOES label list.
 * @returns The entity type, or `''` for background.
 */
export function labelEntityType(labelId: number, labelNames: readonly string[]): string {
  'worklet';
  if (labelId <= 0 || labelId >= labelNames.length) return '';
  const name = labelNames[labelId]!;
  const dash = name.indexOf('-');
  return dash === -1 ? '' : name.slice(dash + 1);
}

/**
 * A contiguous run of same-entity tokens, before text decoding.
 * @category Types
 */
export interface TokenSpan {
  readonly start: number;
  readonly end: number; // exclusive
  readonly entity: string;
}

/**
 * Collapses a per-token label id sequence into contiguous same-entity spans,
 * skipping background (`O`) tokens.
 * @param predictedLabels Per-token predicted label ids.
 * @param labelNames The BIOES label list.
 * @returns The detected token spans in order.
 */
export function extractSpans(
  predictedLabels: Int32Array,
  labelNames: readonly string[]
): TokenSpan[] {
  'worklet';
  const total = predictedLabels.length;
  const spans: TokenSpan[] = [];
  let i = 0;
  while (i < total) {
    const entity = labelEntityType(predictedLabels[i]!, labelNames);
    if (entity.length === 0) {
      i++;
      continue;
    }
    let j = i + 1;
    while (j < total && labelEntityType(predictedLabels[j]!, labelNames) === entity) {
      j++;
    }
    spans.push({ start: i, end: j, entity });
    i = j;
  }
  return spans;
}
