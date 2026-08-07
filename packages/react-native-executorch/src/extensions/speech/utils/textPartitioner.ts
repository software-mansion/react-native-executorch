type Tag = 'eos' | 'pause' | 'whitespace';

// Punctuation Regex Patterns
const EOS_PATTERN = /[.?!;…|।॥¿¡]/;
const PAUSE_PATTERN = /[,:\u2014\u00AB\u00BB]/;
const WHITESPACE_PATTERN = /\s/;

// Standard Partitioning Constants
const MAX_TARGET_PHRASE_LENGTH = 120;
const MIN_PARTITION_LIMIT = 10;
const DEVIATION_SCALING = 0.01;
const TARGET_LENGTH_RATIO = 0.5;

// TTFA Optimization Constants
const INITIAL_TARGET_LENGTH_RATIO = 0.15;
const RAMP_CHARACTER_COUNT = 150;
const INITIAL_SHORT_DEVIATION_SCALE = 0.1;

// Separator Breakpoint Penalties (eos = sentence end, pause = comma/colon, whitespace = word space)
const DEFAULT_SEPARATOR_PENALTY: Record<Tag, number> = { eos: 5, pause: 80, whitespace: 1000 };

/**
 * Configuration options for text partitioning.
 * @category Types
 */
export type PartitionOptions = {
  /**
   * Whether to prioritize shorter initial segment lengths and scale up
   * progressively to minimize Time To First Audio (TTFA).
   * @default false
   */
  readonly prioritizeInitialTtfa?: boolean;

  /**
   * Scaling multiplier for the length deviation penalty when the first segment
   * is shorter than target length. Lower values reduce the length penalty for
   * short initial chunks when prioritizeInitialTtfa is true.
   * @default 0.1
   */
  readonly initialShortDeviationScale?: number;

  /**
   * Custom separator penalties for breakpoint tag types ('eos', 'pause',
   * 'whitespace'). Default: { eos: 5, pause: 80, whitespace: 1000 }.
   */
  readonly separatorPenalties?: {
    readonly eos?: number;
    readonly pause?: number;
    readonly whitespace?: number;
  };
};

function tagFromChar(char: string): Tag | undefined {
  if (EOS_PATTERN.test(char)) return 'eos';
  if (PAUSE_PATTERN.test(char)) return 'pause';
  if (WHITESPACE_PATTERN.test(char)) return 'whitespace';
  return;
}

function getTargetLength(
  startCharIdx: number,
  limit: number,
  prioritizeInitialTtfa: boolean
): number {
  const maxTarget = Math.min(MAX_TARGET_PHRASE_LENGTH, limit * TARGET_LENGTH_RATIO);
  if (!prioritizeInitialTtfa) {
    return maxTarget;
  }
  const minTarget = Math.min(
    maxTarget,
    Math.max(MIN_PARTITION_LIMIT * 2.5, limit * INITIAL_TARGET_LENGTH_RATIO)
  );
  const progress = Math.min(1.0, startCharIdx / RAMP_CHARACTER_COUNT);
  return minTarget + (maxTarget - minTarget) * progress;
}

function sliceAtCuts(text: string, cutIndices: number[]): string[] {
  const chunks: string[] = [];
  let startIdx = 0;
  for (const cutIdx of cutIndices) {
    chunks.push(text.slice(startIdx, cutIdx + 1));
    startIdx = cutIdx + 1;
  }
  chunks.push(text.slice(startIdx));
  return chunks.map((c) => c.trim()).filter((c) => c.length > 0);
}

/**
 * Divides input text into logical segments under the maximum limit using a
 * forward dynamic programming algorithm.
 * @category Utils
 * @param text The input text to partition.
 * @param limit The character limit per partition.
 * @param options Optional configuration for TTFA prioritization and custom penalties.
 * @returns An array of partitioned text segments.
 */
export function partition(text: string, limit: number, options?: PartitionOptions): string[] {
  if (!text) {
    return [];
  }

  if (limit < MIN_PARTITION_LIMIT) {
    throw new Error(`partition: limit ${limit} is below minimum ${MIN_PARTITION_LIMIT}`);
  }

  const prioritizeInitialTtfa = options?.prioritizeInitialTtfa ?? false;
  const initialShortDeviationScale =
    options?.initialShortDeviationScale ?? INITIAL_SHORT_DEVIATION_SCALE;
  const separatorPenalty: Record<Tag, number> = {
    eos: options?.separatorPenalties?.eos ?? DEFAULT_SEPARATOR_PENALTY.eos,
    pause: options?.separatorPenalties?.pause ?? DEFAULT_SEPARATOR_PENALTY.pause,
    whitespace: options?.separatorPenalties?.whitespace ?? DEFAULT_SEPARATOR_PENALTY.whitespace,
  };

  const breakpoints: { idx: number; tag: Tag }[] = [];
  let charIdx = 0;
  for (const char of text) {
    const t = tagFromChar(char);
    if (t) breakpoints.push({ idx: charIdx, tag: t });
    charIdx += char.length;
  }

  if (breakpoints.length === 0 || breakpoints[breakpoints.length - 1]!.idx < text.length - 1) {
    breakpoints.push({ idx: text.length - 1, tag: 'eos' });
  }

  const length = (currBreakIdx: number, prevBreakIdx: number): number => {
    if (prevBreakIdx < 0) return breakpoints[currBreakIdx]!.idx + 1; // no previous cuts
    return breakpoints[currBreakIdx]!.idx - breakpoints[prevBreakIdx]!.idx;
  };

  const cost = (currBreakIdx: number, prevBreakIdx: number): number => {
    const len = length(currBreakIdx, prevBreakIdx);
    if (len > limit) return Infinity;

    const startCharIdx = prevBreakIdx < 0 ? 0 : breakpoints[prevBreakIdx]!.idx + 1;
    const targetLength = getTargetLength(startCharIdx, limit, prioritizeInitialTtfa);

    const isFirstChunk = prevBreakIdx < 0;
    const diff = len - targetLength;
    const devScale =
      prioritizeInitialTtfa && isFirstChunk && diff < 0
        ? DEVIATION_SCALING * initialShortDeviationScale
        : DEVIATION_SCALING;

    return separatorPenalty[breakpoints[currBreakIdx]!.tag] + devScale * diff ** 2;
  };

  // Forward DP Recurrence Relation
  //
  //   minCost[-1] = 0   (virtual start, zero cost)
  //   minCost[i]  = min_{jMin <= j < i} [ minCost[j] + cost(i, j) ]
  //
  // where:
  //   i     – current breakpoint candidate (where we consider a cut).
  //   j     – predecessor breakpoint index (the previous cut).
  //   jMin  – sliding lower bound; any j < jMin would produce a segment
  //           exceeding the hard `limit` constraint.
  //   cost(i, j) – penalty of slicing [j, i], combining:
  //     1. separator-type penalty at i (paragraph / eos vs. space)
  //     2. squared deviation of segment length from `targetLength`
  const minCost = new Float32Array(breakpoints.length);
  const predecessor = new Int32Array(breakpoints.length);

  // jMin tracks the left bound of the sliding window. Because
  // breakpoints[i].idx increases monotonically, any predecessor j that exceeds
  // the limit for current i will also exceed it for all future i' > i.
  // Therefore, jMin is monotonically non-decreasing, and the `while` loop
  // advances it at most O(n) times in total across the entire algorithm run.
  let jMin = -1; // -1 = virtual start (before the text)
  minCost.fill(Infinity);
  predecessor.fill(-2); // sentinel: breakpoint unreachable

  for (let i = 0; i < breakpoints.length; ++i) {
    while (jMin < i && length(i, jMin) > limit) {
      ++jMin;
    }
    for (let j = jMin; j < i; ++j) {
      const total = cost(i, j) + (j < 0 ? 0 : minCost[j]!);
      if (total < minCost[i]!) {
        minCost[i] = total;
        predecessor[i] = j;
      }
    }
  }

  if (minCost[breakpoints.length - 1] === Infinity) {
    throw new Error(`partition: text cannot be divided into chunks of length <= ${limit}`);
  }

  const cuts: number[] = [];
  let i = breakpoints.length - 1;
  while (i >= 0) {
    cuts.push(breakpoints[i]!.idx);
    i = predecessor[i]!;
  }

  return sliceAtCuts(text, cuts.reverse());
}
