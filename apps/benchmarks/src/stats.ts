/**
 * Summary statistics over a set of timing samples.
 *
 * The comparator compares medians rather than means: a single scheduling
 * hiccup or a thermal throttle step moves the mean of a 20-sample run by more
 * than a genuine 5% regression does, while the median shrugs it off. `iqr` is
 * carried alongside so the comparator can tell a real shift from a noisy run.
 */
export interface Stats {
  /** Number of samples. */
  readonly count: number;
  readonly min: number;
  readonly max: number;
  readonly mean: number;
  readonly median: number;
  /** 90th percentile, by nearest-rank. Surfaces tail latency. */
  readonly p90: number;
  /** Interquartile range — the run's own noise floor. */
  readonly iqr: number;
  readonly stdev: number;
}

const round = (value: number): number => Math.round(value * 1000) / 1000;

/**
 * Nearest-rank percentile over an already-sorted array.
 * @param sorted The samples, ascending.
 * @param fraction The percentile to take, in `[0, 1]`.
 * @returns The sample at that rank, or 0 when there are none.
 */
const percentile = (sorted: readonly number[], fraction: number): number => {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil(fraction * sorted.length);
  return sorted[Math.min(Math.max(rank, 1), sorted.length) - 1]!;
};

/**
 * Middle value of an already-sorted array, averaging the two middles on an
 * even count.
 * @param sorted The samples, ascending.
 * @returns The median, or 0 when there are no samples.
 */
const median = (sorted: readonly number[]): number => {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

/**
 * Reduces raw timing samples to the summary the report carries.
 * @param samples Per-iteration durations, in any order.
 * @returns The summary statistics, all rounded to three decimals.
 */
export function summarize(samples: readonly number[]): Stats {
  if (samples.length === 0) {
    return { count: 0, min: 0, max: 0, mean: 0, median: 0, p90: 0, iqr: 0, stdev: 0 };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  const variance = sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) / sorted.length;

  return {
    count: sorted.length,
    min: round(sorted[0]!),
    max: round(sorted[sorted.length - 1]!),
    mean: round(mean),
    median: round(median(sorted)),
    p90: round(percentile(sorted, 0.9)),
    iqr: round(percentile(sorted, 0.75) - percentile(sorted, 0.25)),
    stdev: round(Math.sqrt(variance)),
  };
}
