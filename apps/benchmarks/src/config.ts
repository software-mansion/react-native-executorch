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

const num = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseFloat(str(value, ''));
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

/**
 * Named subsets of the variant list.
 *
 * - `quick` — the small vision and text models. Minutes, not hours.
 * - `full` — every published variant except the LLMs.
 * - `everything` — including the LLMs, which are around 90 GB of the estate on
 *   Android and want a dedicated, unattended run.
 */
export type SuiteName = 'quick' | 'full' | 'everything';

const SUITES: readonly SuiteName[] = ['quick', 'full', 'everything'];

export interface BenchConfig {
  readonly suite: SuiteName;
  /** Explicit case ids to run, overriding `suite`. Empty means "use the suite". */
  readonly only: readonly string[];
  /** Registry tasks to include. Empty means "whatever the tier says". */
  readonly tasks: readonly string[];
  /** Backend tags to include. Empty means every backend this platform runs. */
  readonly backends: readonly string[];
  /** Timed iterations per measurement. */
  readonly iterations: number;
  /** Untimed iterations run before each measurement to warm caches and JIT. */
  readonly warmup: number;
  /** Iterations run during the separate, sampled memory pass. */
  readonly memoryIterations: number;
  /**
   * Times each model is loaded and disposed to produce a load-time median.
   *
   * Kept low because a load is expensive (over a second for the privacy filter)
   * and cannot be warmed up: the point is a cold load. But it cannot be 1. A
   * single sample of a load swung 45% between two runs of identical code, which
   * is enough to report a regression that is not there.
   */
  readonly loadIterations: number;
  /**
   * Independent repeats of each case.
   *
   * A repeat is a whole measurement taken again from a cold pipeline, with the
   * device cooled back to the gate temperature in between. That is a different
   * thing from `iterations`, which are back-to-back calls inside one
   * measurement: iterations bound the noise within a measurement, repeats
   * expose the run-to-run spread that thermal state and clock drift produce,
   * which is the larger of the two on a phone.
   */
  readonly repeats: number;
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
  /** Free-form label identifying the build under test, e.g. `et-1.4.1`. */
  readonly label: string;
  /**
   * Battery temperature, in Celsius, the device must be at or below before each
   * measurement. The host enforces it; see `src/gate.ts`.
   */
  readonly maxTempC: number;
  /** Seconds the host may wait for the gate before giving up and measuring warm. */
  readonly gateTimeoutS: number;
  /**
   * Largest total download a case may have, in bytes. 0 disables the cap.
   *
   * Defaults to 6 GB: past that a model is competing with the whole of a
   * phone's RAM, and the run is better off recording that it did not try.
   */
  readonly maxBytes: number;
  /**
   * Whether to keep a case's downloaded files after it finishes.
   *
   * Off by default. The Android estate is around 118 GB; with deletion on, peak
   * usage is one model rather than all of them. Turn it on for a repeated run
   * over a small tier, where re-downloading costs more than the disk does.
   */
  readonly keepModels: boolean;
}

const suite = ((): SuiteName => {
  const requested = str(process.env.EXPO_PUBLIC_BENCH_SUITE, 'quick') as SuiteName;
  return SUITES.includes(requested) ? requested : 'quick';
})();

export const config: BenchConfig = {
  suite,
  only: list(process.env.EXPO_PUBLIC_BENCH_ONLY),
  tasks: list(process.env.EXPO_PUBLIC_BENCH_TASKS),
  backends: list(process.env.EXPO_PUBLIC_BENCH_BACKENDS),
  iterations: int(process.env.EXPO_PUBLIC_BENCH_ITERATIONS, 20),
  warmup: int(process.env.EXPO_PUBLIC_BENCH_WARMUP, 3),
  memoryIterations: int(process.env.EXPO_PUBLIC_BENCH_MEMORY_ITERATIONS, 5),
  loadIterations: int(process.env.EXPO_PUBLIC_BENCH_LOAD_ITERATIONS, 3),
  repeats: Math.max(1, int(process.env.EXPO_PUBLIC_BENCH_REPEATS, 3)),
  measureMemory: bool(process.env.EXPO_PUBLIC_BENCH_MEMORY, true),
  measureNative: bool(process.env.EXPO_PUBLIC_BENCH_NATIVE, true),
  sampleIntervalMs: int(process.env.EXPO_PUBLIC_BENCH_SAMPLE_INTERVAL_MS, 100),
  sink: process.env.EXPO_PUBLIC_BENCH_SINK || null,
  autostart: bool(process.env.EXPO_PUBLIC_BENCH_AUTOSTART, true),
  label: str(process.env.EXPO_PUBLIC_BENCH_LABEL, 'local'),
  maxTempC: num(process.env.EXPO_PUBLIC_BENCH_MAX_TEMP_C, 35),
  gateTimeoutS: int(process.env.EXPO_PUBLIC_BENCH_GATE_TIMEOUT_S, 1800),
  maxBytes: int(process.env.EXPO_PUBLIC_BENCH_MAX_BYTES, 6_000_000_000),
  keepModels: bool(process.env.EXPO_PUBLIC_BENCH_KEEP_MODELS, false),
};
