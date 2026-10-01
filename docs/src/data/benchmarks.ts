import rawData from './benchmarks.json';

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

export const benchmarkRows: BenchmarkRow[] = rawData as BenchmarkRow[];

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
  lowerIsBetter: boolean;
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
    lowerIsBetter: false,
  },
  {
    id: 'peakMb',
    label: 'Peak Memory',
    unit: 'MB',
    description: 'Peak resident memory (RAM) allocated during model execution.',
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
    description:
      'Binary download file size of the compiled model bundle (depends on backend and precision, independent of device).',
    lowerIsBetter: true,
  },
];

export const DEVICES: Device[] = [
  { id: 's26ultra', shortName: 'S26 Ultra' },
  { id: 'pixel10', shortName: 'Pixel 10' },
  { id: 's20plus', shortName: 'S20+' },
  { id: 'iphone17', shortName: 'iPhone 17' },
  { id: 'iphonese', shortName: 'iPhone SE 3' },
];
