/**
 * Run configuration, resolved once at startup from `EXPO_PUBLIC_BENCH_*`
 * environment variables.
 *
 * Metro inlines `process.env.EXPO_PUBLIC_*` at bundle time, so every value here
 * is fixed when the JS bundle is built. `scripts/run-benchmarks.mjs` sets them
 * before starting Metro; a developer running the app by hand gets the defaults.
 */

const str = (value: string | undefined, fallback: string): string =>
  value === undefined || value === '' ? fallback : value;

const int = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(str(value, ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const bool = (value: string | undefined, fallback: boolean): boolean => {
  const normalized = str(value, '').toLowerCase();
  if (normalized === '') return fallback;
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
};

const list = (value: string | undefined): string[] =>
  str(value, '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

/** Named subsets of the case list. See `src/suite.ts` for the membership rules. */
export type SuiteName = 'quick' | 'full';

export interface BenchConfig {
  /** Which named subset to run. Ignored when `only` is non-empty. */
  readonly suite: SuiteName;
  /** Explicit case ids to run, overriding `suite`. Empty means "use the suite". */
  readonly only: readonly string[];
  /** Timed iterations per measurement. */
  readonly iterations: number;
  /** Untimed iterations run before each measurement to warm caches and JIT. */
  readonly warmup: number;
  /** Iterations run during the separate, sampled memory pass. */
  readonly memoryIterations: number;
  /** Whether to run the memory pass at all. */
  readonly measureMemory: boolean;
  /** Whether to run the schema-driven raw `model.execute` pass. */
  readonly measureNative: boolean;
  /** Polling period of the memory sampler, in milliseconds. */
  readonly sampleIntervalMs: number;
  /** Base URL of the collector run by `scripts/run-benchmarks.mjs`, or null. */
  readonly sink: string | null;
  /** Whether to start the suite as soon as the app mounts. */
  readonly autostart: boolean;
  /** Free-form label identifying the build under test, e.g. `et-1.3.1`. */
  readonly label: string;
}

export const config: BenchConfig = {
  suite: str(process.env.EXPO_PUBLIC_BENCH_SUITE, 'quick') === 'full' ? 'full' : 'quick',
  only: list(process.env.EXPO_PUBLIC_BENCH_ONLY),
  iterations: int(process.env.EXPO_PUBLIC_BENCH_ITERATIONS, 20),
  warmup: int(process.env.EXPO_PUBLIC_BENCH_WARMUP, 3),
  memoryIterations: int(process.env.EXPO_PUBLIC_BENCH_MEMORY_ITERATIONS, 5),
  measureMemory: bool(process.env.EXPO_PUBLIC_BENCH_MEMORY, true),
  measureNative: bool(process.env.EXPO_PUBLIC_BENCH_NATIVE, true),
  sampleIntervalMs: int(process.env.EXPO_PUBLIC_BENCH_SAMPLE_INTERVAL_MS, 100),
  sink: process.env.EXPO_PUBLIC_BENCH_SINK || null,
  autostart: bool(process.env.EXPO_PUBLIC_BENCH_AUTOSTART, true),
  label: str(process.env.EXPO_PUBLIC_BENCH_LABEL, 'local'),
};
