export type BenchmarkRow = {
  task: string;
  model: string;
  backend: string;
  precision: string;
  device: string;
  medianMs: number;
  meanMs?: number;
  etMs?: number;
  share?: number;
  tokensPerSecond?: number;
  ttftMs?: number;
  peakMb: number;
  loadMs: number;
  sizeMb: number;
};

/**
 * Joins rows generated from raw runs (`measured.json`) with published rows
 * that have no raw runs behind them (`imported.json`). Measured variants
 * replace matching imported variants; other published results remain available
 * when a device has only a partial new run.
 * @param measured Rows built by `yarn bench:docs` in `apps/benchmarks`.
 * @param imported Rows with no raw runs.
 * @returns The rows to chart.
 */
export function mergeBenchmarkRows(
  measured: readonly BenchmarkRow[],
  imported: readonly BenchmarkRow[]
): BenchmarkRow[] {
  const key = (row: BenchmarkRow) =>
    JSON.stringify([row.device, row.task, row.model, row.backend, row.precision]);
  const measuredVariants = new Set(measured.map(key));
  return [...measured, ...imported.filter((row) => !measuredVariants.has(key(row)))];
}

export type MetricId =
  | 'tokensPerSecond'
  | 'ttftMs'
  | 'medianMs'
  | 'meanMs'
  | 'etMs'
  | 'share'
  | 'peakMb'
  | 'loadMs'
  | 'sizeMb';

export type Metric = {
  id: MetricId;
  label: string;
  unit: 'ms' | 'MB' | '%' | 'tok/s';
  description: string;
  // null for metrics with no better direction, e.g. model time share.
  lowerIsBetter: boolean | null;
};

export type Device = {
  id: string;
  shortName: string;
};

export const METRICS: Metric[] = [
  {
    id: 'tokensPerSecond',
    label: 'Tokens / sec',
    unit: 'tok/s',
    description: 'Autoregressive decoding throughput (tokens generated per second).',
    lowerIsBetter: false,
  },
  {
    id: 'ttftMs',
    label: 'Time to First Token',
    unit: 'ms',
    description: 'Latency from prompt input to the generation of the first token (prompt prefill).',
    lowerIsBetter: true,
  },
  {
    id: 'meanMs',
    label: 'Pipeline Time',
    unit: 'ms',
    description:
      'Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).',
    lowerIsBetter: true,
  },
  {
    id: 'etMs',
    label: 'ExecuTorch Model Time',
    unit: 'ms',
    description:
      'Time spent exclusively executing the model forward pass within the ExecuTorch runtime.',
    lowerIsBetter: true,
  },
  {
    id: 'share',
    label: 'Model Time Share',
    unit: '%',
    description:
      'Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.',
    lowerIsBetter: null,
  },
  {
    id: 'peakMb',
    label: 'Peak Process Memory',
    unit: 'MB',
    description:
      'Sampled process footprint during inference, including the app baseline: total PSS on Android and phys_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.',
    lowerIsBetter: true,
  },
  {
    id: 'loadMs',
    label: 'Load Time',
    unit: 'ms',
    description: 'Cold-start duration to load model weights and initialize the runtime session.',
    lowerIsBetter: true,
  },
  {
    id: 'sizeMb',
    label: 'Model Size',
    unit: 'MB',
    description: 'Binary download file size of the compiled model bundle.',
    lowerIsBetter: true,
  },
];

export const DEVICES: Device[] = [
  { id: 's26ultra', shortName: 'S26 Ultra' },
  { id: 'pixel10', shortName: 'Pixel 10' },
  { id: 's20plus', shortName: 'S20+' },
  { id: 's24', shortName: 'S24' },
  { id: 'iphone17', shortName: 'iPhone 17' },
  { id: 'iphonese', shortName: 'iPhone SE 3' },
];
