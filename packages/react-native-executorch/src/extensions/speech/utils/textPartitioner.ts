type Tag = 'eos' | 'pause' | 'whitespace';

const EOS_PATTERN = /[.?!;…|।॥¿¡]/;
const PAUSE_PATTERN = /[,:\-—«»]/;
const WHITESPACE_PATTERN = /\s/;

const MAX_TARGET_PHRASE_LENGTH = 120;
const MIN_PARTITION_LIMIT = 10;
const DEVIATION_SCALING = 0.05;
const TARGET_LENGTH_RATIO = 0.5;
const SEPARATOR_PENALTY: Record<Tag, number> = { eos: 5, pause: 18, whitespace: 1000 };

function tagFromChar(char: string): Tag | undefined {
  if (EOS_PATTERN.test(char)) return 'eos';
  if (PAUSE_PATTERN.test(char)) return 'pause';
  if (WHITESPACE_PATTERN.test(char)) return 'whitespace';
  return;
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
 * @returns An array of partitioned text segments.
 */
export function partition(text: string, limit: number): string[] {
  if (!text || limit < MIN_PARTITION_LIMIT) {
    return [text];
  }

  const breakpoints: { idx: number; tag: Tag }[] = [];
  let charIdx = 0;
  for (const char of text) {
    const t = tagFromChar(char);
    if (t) breakpoints.push({ idx: charIdx, tag: t });
    ++charIdx;
  }

  const n = breakpoints.length;
  const targetLength = Math.min(MAX_TARGET_PHRASE_LENGTH, limit * TARGET_LENGTH_RATIO);

  if (n === 0) {
    return [text];
  }

  const length = (currBreakIdx: number, prevBreakIdx: number): number => {
    if (prevBreakIdx < 0) return breakpoints[currBreakIdx]!.idx + 1; // no previous cuts
    return breakpoints[currBreakIdx]!.idx - breakpoints[prevBreakIdx]!.idx;
  };

  const cost = (currBreakIdx: number, prevBreakIdx: number): number => {
    const len = length(currBreakIdx, prevBreakIdx);
    if (len > limit) return Infinity;
    return (
      SEPARATOR_PENALTY[breakpoints[currBreakIdx]!.tag] +
      DEVIATION_SCALING * (len - targetLength) ** 2
    );
  };

  // Forward DP Recurrence Relation
  // ```
  // minCost[i] = min cost of a valid partition ending with a cut at breakpoint i.
  // minCost[i] = min_{jMin <= j < i} [ minCost[j] + cost(i, j) ]
  // minCost[-1] = 0 (virtual starting point before any text, costing 0)
  // ```
  // Where:
  // - i: the current breakpoint candidate where we consider making a cut.
  // - j: a candidate predecessor breakpoint (the index of the previous cut).
  // - jMin: the sliding lower bound index. Any predecessor j < jMin would
  //   produce a segment between j and i that exceeds the hard `limit`
  //   constraint.
  // - minCost[j]: the optimal cost of partitioning the text from the start up
  //   to breakpoint j.
  // - cost(i, j): the penalty of slicing between j and i, which combines:
  //     1. The penalty of the separator type at i (e.g. paragraph/eos break vs.
  //        spaces).
  //     2. The squared deviation of the segment's length from the optimal
  //        `targetLength`.
  // - .
  const minCost = new Float32Array(n);
  const predecessor = new Int32Array(n);

  // jMin tracks the left bound of the sliding window. Because
  // breakpoints[i].idx increases monotonically, any predecessor j that exceeds
  // the limit for current i will also exceed it for all future i' > i.
  // Therefore, jMin is monotonically non-decreasing, and the `while` loop
  // advances it at most O(n) times in total across the entire algorithm run.
  let jMin = -1; // -1 = virtual start (before the text)
  minCost.fill(Infinity);
  predecessor.fill(-2); // sentinel: breakpoint unreachable

  for (let i = 0; i < n; ++i) {
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

  if (minCost[n - 1] === Infinity) {
    throw new Error(`partition: text cannot be divided into chunks of length <= ${limit}`);
  }

  const cuts: number[] = [];
  let i = n - 1;
  while (i >= 0) {
    cuts.push(breakpoints[i]!.idx);
    i = predecessor[i]!;
  }

  return sliceAtCuts(text, cuts.reverse());
}
