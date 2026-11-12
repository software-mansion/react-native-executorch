/**
 * Splits long text into chunks within a duration limit.
 */

import { RnExecuTorchError } from '../../../core/error';
import { EOS_PATTERN, PAUSE_PATTERN } from './textPartitioner';

const DEFAULT_MAX_DURATION = 20;
const CLOSERS = /["'”’»)\]}]+$/u; // closing quotes and brackets after a word's punctuation

/**
 * Options for {@link partitionReverbText}.
 * @category Speech / Types
 */
export type ReverbPartitionOptions = {
  /** Max seconds per chunk. Defaults to 20. */
  readonly maxDuration?: number;
  /** A further condition every chunk must meet. */
  readonly fits?: (chunk: string) => boolean;
};

// Splits words into runs, each ending at a word whose final mark (past closers) matches `boundary`.
function splitAfter(words: readonly string[], boundary: RegExp): string[][] {
  const runs: string[][] = [[]];
  for (const word of words) {
    runs[runs.length - 1]!.push(word);
    if (boundary.test(word.replace(CLOSERS, '').slice(-1))) runs.push([]);
  }
  return runs.filter((run) => run.length > 0);
}

/**
 * Splits text into chunks of at most `maxDuration` seconds each. Greedy,
 * coarsest boundary first: whole sentences, then other punctuation, then words.
 * A single word that doesn't fit is a chunk of its own.
 * @category Speech / Functions
 * @param text The text.
 * @param duration Estimated seconds of speech of a chunk.
 * @param options See {@link ReverbPartitionOptions}.
 * @returns The chunks, which joined with spaces give back the text.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if `maxDuration` is
 * not positive.
 */
export function partitionReverbText(
  text: string,
  duration: (chunk: string) => number,
  options?: ReverbPartitionOptions
): string[] {
  const maxDuration = options?.maxDuration ?? DEFAULT_MAX_DURATION;
  if (!(maxDuration > 0)) {
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
      'partitionReverbText: maxDuration must be positive.'
    );
  }
  const fits = (words: readonly string[]): boolean => {
    const chunk = words.join(' ');
    return duration(chunk) <= maxDuration && (options?.fits?.(chunk) ?? true);
  };

  // A unit too long on its own is replaced by its pieces at the next finer boundary.
  const boundaries = [EOS_PATTERN, PAUSE_PATTERN];
  const queue = splitAfter(text.split(/\s+/).filter(Boolean), EOS_PATTERN).map((words) => ({
    words,
    level: 0,
  }));
  const chunks: string[] = [];
  let current: string[] = [];

  while (queue.length > 0) {
    const unit = queue.shift()!;
    if (fits([...current, ...unit.words])) {
      current = [...current, ...unit.words];
    } else if (current.length > 0) {
      chunks.push(current.join(' '));
      current = [];
      queue.unshift(unit);
    } else if (unit.words.length === 1) {
      chunks.push(unit.words[0]!);
    } else {
      let level = unit.level + 1;
      let pieces = level < boundaries.length ? splitAfter(unit.words, boundaries[level]!) : [];
      if (pieces.length < 2) {
        level = boundaries.length;
        pieces = unit.words.map((word) => [word]);
      }
      queue.unshift(...pieces.map((words) => ({ words, level })));
    }
  }
  if (current.length > 0) chunks.push(current.join(' '));
  return chunks;
}
