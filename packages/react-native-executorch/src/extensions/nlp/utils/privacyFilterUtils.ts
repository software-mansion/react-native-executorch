// Privacy-filter-specific helpers: BIOES grammar construction and constrained
// Viterbi decoding over per-token logits, plus span extraction. The decoder is
// our own implementation of the standard Viterbi algorithm, constrained to
// valid BIOES transitions and calibrated by the biases published alongside the
// models. The transformer forward pass dominates the inference budget, so this
// decoding is written in pure TypeScript rather than a native op (see the
// `add-native-extension` skill's Amdahl's-law rule).

const NEG_INF = Number.NEGATIVE_INFINITY;

/**
 * Six Viterbi transition biases matching the openai/privacy-filter
 * `viterbi_calibration.json` schema (hosted at
 * https://huggingface.co/software-mansion/react-native-executorch-privacy-filter-openai/blob/main/viterbi_calibration.json).
 * Each value is added to the decoder score whenever the corresponding BIOES
 * transition is taken. Positive values encourage the transition; negative
 * values discourage it. Every field defaults to `0` (a neutral, validity-only
 * Viterbi).
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

// Label role classes. Anything that isn't a well-formed `X-entity` tag (and the
// literal "O") is treated as background, matching the BIOES grammar below.
const CLASS_O = 0;
const CLASS_B = 1;
const CLASS_I = 2;
const CLASS_E = 3;
const CLASS_S = 4;

/**
 * Pre-computed BIOES grammar consumed by {@link viterbiDecode}.
 *
 * Rather than an `N x N` transition matrix, the grammar is stored as the small
 * set of groups the transition rules actually depend on. Under BIOES every
 * target's best predecessor comes from one of three group maxima — the best
 * background state, the best span-closing (`E-`/`S-`) state, or, per entity,
 * the best of that entity's `B-`/`I-` states — which is what lets the decode
 * step run in `O(numLabels + numEntities)` instead of `O(numLabels^2)`.
 * @category Types
 */
export interface Grammar {
  /** Total number of labels, i.e. `1 + 4 * numEntities`. */
  readonly numLabels: number;
  /** Number of entity types (each contributing its `B`/`I`/`E`/`S` labels). */
  readonly numEntities: number;
  /** Role class per label (`CLASS_O`/`B`/`I`/`E`/`S`). */
  readonly labelClass: Int8Array;
  /** Entity group id per label; `-1` for background labels. */
  readonly entityOf: Int32Array;
  /** Indices of all background (`O`-class) labels. */
  readonly oLabels: Int32Array;
  /** Indices of all span-closing (`E-`/`S-`) labels. */
  readonly esLabels: Int32Array;
  /** Per entity, the index of its `B-` label, or `-1`. */
  readonly bOf: Int32Array;
  /** Per entity, the index of its `I-` label, or `-1`. */
  readonly iOf: Int32Array;
  /** `true` iff the label is a legal first-token label (`O`, `B-x`, `S-x`). */
  readonly validStart: boolean[];
  /** Transition biases, with every optional field resolved to its default. */
  readonly biases: Required<ViterbiBiases>;
}

function classOf(name: string): number {
  if (name.length < 2 || name[1] !== '-') return CLASS_O;
  switch (name[0]) {
    case 'B':
      return CLASS_B;
    case 'I':
      return CLASS_I;
    case 'E':
      return CLASS_E;
    case 'S':
      return CLASS_S;
    default:
      return CLASS_O;
  }
}

/**
 * Builds the grouped BIOES grammar for a label space. Called once at pipeline
 * construction (not on the worklet thread), so the per-token decode loop only
 * reads the pre-computed {@link Grammar}.
 *
 * The encoded grammar is:
 * - `O` / `E-x` / `S-x` -> `O` | `B-y` | `S-y`
 * - `B-x` / `I-x` -> `I-x` | `E-x` (same entity)
 * @param labelNames BIOES label list; index 0 must be `'O'`.
 * @param biases Optional transition biases; missing fields default to `0`.
 * @returns The pre-computed grammar.
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
  const labelClass = new Int8Array(n);
  const entityOf = new Int32Array(n).fill(-1);
  const validStart: boolean[] = new Array(n).fill(false);
  const oLabels: number[] = [];
  const esLabels: number[] = [];
  const entityIds = new Map<string, number>();

  for (let i = 0; i < n; i++) {
    const name = labelNames[i]!;
    const cls = classOf(name);
    labelClass[i] = cls;
    validStart[i] = cls === CLASS_O || cls === CLASS_B || cls === CLASS_S;

    if (cls === CLASS_O) {
      oLabels.push(i);
      continue;
    }
    const entity = name.slice(2);
    let id = entityIds.get(entity);
    if (id === undefined) {
      id = entityIds.size;
      entityIds.set(entity, id);
    }
    entityOf[i] = id;
    if (cls === CLASS_E || cls === CLASS_S) esLabels.push(i);
  }

  const numEntities = entityIds.size;
  const bOf = new Int32Array(numEntities).fill(-1);
  const iOf = new Int32Array(numEntities).fill(-1);
  for (let i = 0; i < n; i++) {
    const e = entityOf[i]!;
    if (e < 0) continue;
    if (labelClass[i] === CLASS_B) bOf[e] = i;
    else if (labelClass[i] === CLASS_I) iOf[e] = i;
  }

  return {
    numLabels: n,
    numEntities,
    labelClass,
    entityOf,
    oLabels: Int32Array.from(oLabels),
    esLabels: Int32Array.from(esLabels),
    bOf,
    iOf,
    validStart,
    biases: resolved,
  };
}

/**
 * Runs constrained Viterbi over a `[validLen, numLabels]` slice of per-token
 * logits and returns the best BIOES-grammar-valid label-id sequence (length
 * `validLen`).
 * @param logits Flat row-major logits; row `t` starts at `t * numLabels`.
 * @param validLen Number of leading token rows to decode.
 * @param grammar Pre-computed grammar tables from {@link buildGrammar}.
 * @param constrainEnd When `true`, the decoded sequence is forced to end on a
 * valid BIOES terminal (`O`/`E-x`/`S-x`) rather than an open span (`B-x`/`I-x`).
 * Pass `true` only when this slice ends where the text ends; a slice cut mid-span
 * (e.g. an interior sliding window) should leave this `false`. Defaults to
 * `false`.
 * @returns The most likely label id per token.
 */
export function viterbiDecode(
  logits: Float32Array,
  validLen: number,
  grammar: Grammar,
  constrainEnd: boolean = false
): Int32Array {
  'worklet';
  const n = grammar.numLabels;
  if (validLen <= 0) return new Int32Array(0);

  const { labelClass, entityOf, oLabels, esLabels, bOf, iOf, numEntities, biases: b } = grammar;
  let dp = new Float32Array(n);
  let dpNext = new Float32Array(n);
  // bp[t*n + j]: best predecessor of label j at step t. Row 0 is unused
  // (traceback starts at t = 1).
  const bp = new Int32Array(validLen * n);
  // Per-entity best of {B-x, I-x}, the only predecessors an I-x/E-x can have.
  const maxInside = new Float32Array(numEntities);
  const argInside = new Int32Array(numEntities);

  for (let j = 0; j < n; j++) {
    dp[j] = grammar.validStart[j] ? logits[j]! : NEG_INF;
  }

  for (let t = 1; t < validLen; t++) {
    const rowOffset = t * n;

    // Every background/span-opening target shares the same two candidate
    // predecessors, so resolve them once per token rather than per label.
    let maxO = NEG_INF;
    let argO = 0;
    for (let k = 0; k < oLabels.length; k++) {
      const i = oLabels[k]!;
      if (dp[i]! > maxO) {
        maxO = dp[i]!;
        argO = i;
      }
    }
    let maxES = NEG_INF;
    let argES = 0;
    for (let k = 0; k < esLabels.length; k++) {
      const i = esLabels[k]!;
      if (dp[i]! > maxES) {
        maxES = dp[i]!;
        argES = i;
      }
    }

    let bestO = NEG_INF;
    let argBestO = 0;
    let bestStart = NEG_INF;
    let argBestStart = 0;
    if (maxO > NEG_INF) {
      bestO = maxO + b.backgroundStay;
      argBestO = argO;
      bestStart = maxO + b.backgroundToStart;
      argBestStart = argO;
    }
    if (maxES > NEG_INF) {
      const toO = maxES + b.endToBackground;
      if (toO > bestO) {
        bestO = toO;
        argBestO = argES;
      }
      const toStart = maxES + b.endToStart;
      if (toStart > bestStart) {
        bestStart = toStart;
        argBestStart = argES;
      }
    }

    for (let e = 0; e < numEntities; e++) {
      let m = NEG_INF;
      let arg = 0;
      const bi = bOf[e]!;
      if (bi >= 0 && dp[bi]! > m) {
        m = dp[bi]!;
        arg = bi;
      }
      const ii = iOf[e]!;
      if (ii >= 0 && dp[ii]! > m) {
        m = dp[ii]!;
        arg = ii;
      }
      maxInside[e] = m;
      argInside[e] = arg;
    }

    for (let j = 0; j < n; j++) {
      const cls = labelClass[j]!;
      let best: number;
      let bestPrev: number;
      if (cls === CLASS_O) {
        best = bestO;
        bestPrev = argBestO;
      } else if (cls === CLASS_B || cls === CLASS_S) {
        best = bestStart;
        bestPrev = argBestStart;
      } else {
        const e = entityOf[j]!;
        const m = maxInside[e]!;
        if (m > NEG_INF) {
          best = m + (cls === CLASS_I ? b.insideToContinue : b.insideToEnd);
          bestPrev = argInside[e]!;
        } else {
          best = NEG_INF;
          bestPrev = 0;
        }
      }
      dpNext[j] = best <= NEG_INF ? NEG_INF : best + logits[rowOffset + j]!;
      bp[rowOffset + j] = bestPrev;
    }

    const swap = dp;
    dp = dpNext;
    dpNext = swap;
  }

  // Pick the highest-scoring final state. When `constrainEnd` is set, restrict
  // it to a valid BIOES terminal (background or a span-closing E-/S-) so the
  // sequence cannot end on an unclosed B-/I-. `O` is always both a valid
  // terminal and reachable, so a constrained end always finds a candidate.
  let bestEnd = -1;
  let bestScore = NEG_INF;
  for (let j = 0; j < n; j++) {
    if (constrainEnd) {
      const cls = labelClass[j]!;
      if (cls !== CLASS_O && cls !== CLASS_E && cls !== CLASS_S) continue;
    }
    if (dp[j]! > bestScore) {
      bestScore = dp[j]!;
      bestEnd = j;
    }
  }
  if (bestEnd < 0) bestEnd = 0;

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

// A BIOES span-opening tag: `B-x` (begin of a multi-token span) or `S-x` (a
// single-token span). Used to split two adjacent same-entity spans that would
// otherwise look like one contiguous run. Kept self-contained (rather than
// reusing `classOf`) so it is safe to call from the worklet thread.
function isSpanOpener(labelId: number, labelNames: readonly string[]): boolean {
  'worklet';
  if (labelId <= 0 || labelId >= labelNames.length) return false;
  const name = labelNames[labelId]!;
  return name.length >= 2 && name[1] === '-' && (name[0] === 'B' || name[0] === 'S');
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
 * Collapses a per-token label id sequence into same-entity spans, skipping
 * background (`O`) tokens. A span runs from an opener token through the
 * following same-entity tokens, but stops before the next opener (`B-x`/`S-x`)
 * so two adjacent same-type entities (e.g. `S-x` then `B-x E-x`) stay separate
 * rather than merging into one run.
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
    while (
      j < total &&
      labelEntityType(predictedLabels[j]!, labelNames) === entity &&
      !isSpanOpener(predictedLabels[j]!, labelNames)
    ) {
      j++;
    }
    spans.push({ start: i, end: j, entity });
    i = j;
  }
  return spans;
}
