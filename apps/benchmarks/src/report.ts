/**
 * Result shapes and the two channels results leave the device by.
 *
 * Getting numbers off a phone is the awkward part of on-device benchmarking:
 * `adb logcat` works for Android, `xcrun simctl` only for the iOS Simulator, and
 * a physical iPhone has no equivalent that does not involve Console.app. So the
 * harness writes to both channels — a line-prefixed console log a human can read
 * straight from Metro, and an HTTP POST to the collector in
 * `scripts/run-benchmarks.mjs`, which works identically on a simulator, an
 * emulator and real hardware over `adb reverse` or the LAN.
 */

import type { BenchDeviceInfo } from '../modules/bench-probe';
import type { NativeResult } from './nativeForward';
import type { Stats } from './stats';
import { config } from './config';

/** Prefix that makes result lines greppable in a log stream. */
export const LOG_PREFIX = 'RNE_BENCH';

export interface CaseResult {
  readonly id: string;
  readonly task: string;
  readonly model: string;
  readonly status: 'ok' | 'error';
  /** Failure detail. Present only when `status` is `error`. */
  readonly error?: string;
  readonly note?: string;
  /** Whether timings came from the worklet runtime or the RN thread. */
  readonly mode: 'worklet' | 'async';
  /** Milliseconds spent resolving remote model files. 0 when fully cached. */
  readonly downloadMs: number;
  /** Milliseconds for the task pipeline's `create` call, model load included. */
  readonly taskLoadMs: number;
  /** End-to-end pipeline timings: preprocessing, execute, and post-processing. */
  readonly pipeline?: Stats;
  /** Workload size the pipeline reported. See `TimedRun.units`. */
  readonly units?: number;
  /** Raw `model.execute` timings, per exported method. */
  readonly native?: NativeResult;
  readonly memory?: {
    /** Footprint before the model was loaded, in MB. */
    readonly baselineMb: number;
    /** Footprint once the pipeline was ready, in MB. */
    readonly loadedMb: number;
    /** Peak footprint observed during the sampled inference pass, in MB. */
    readonly peakMb: number;
    /** Footprint after `dispose`, in MB. Should return near the baseline. */
    readonly disposedMb: number;
  };
}

export interface RunReport {
  /** Report schema version. Bumped when a field's meaning changes. */
  readonly schemaVersion: 1;
  /** Label identifying the build under test, e.g. `et-1.3.1`. */
  readonly label: string;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly platform: string;
  readonly device: BenchDeviceInfo;
  readonly settings: {
    readonly suite: string;
    readonly iterations: number;
    readonly warmup: number;
    readonly memoryIterations: number;
  };
  readonly cases: readonly CaseResult[];
}

const post = async (path: string, body: unknown): Promise<void> => {
  if (!config.sink) return;
  try {
    await fetch(`${config.sink}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    // The collector is optional: a developer running the app by hand has no
    // sink at all. Losing it must not take the run down, since the console
    // channel still carries every result.
    console.warn(`${LOG_PREFIX}_SINK_ERROR ${String(error)}`);
  }
};

/**
 * Announces the case list before any work starts.
 * @param ids The cases about to run, in order.
 */
export async function reportStart(ids: readonly string[]): Promise<void> {
  console.log(`${LOG_PREFIX}_BEGIN ${JSON.stringify({ label: config.label, cases: ids })}`);
  await post('/begin', { label: config.label, cases: ids });
}

/**
 * Emits one case's result as soon as it is available.
 * @param result The finished case.
 */
export async function reportCase(result: CaseResult): Promise<void> {
  console.log(`${LOG_PREFIX}_CASE ${JSON.stringify(result)}`);
  await post('/case', result);
}

/**
 * Emits the complete report.
 * @param report The finished run.
 */
export async function reportEnd(report: RunReport): Promise<void> {
  console.log(`${LOG_PREFIX}_END ${JSON.stringify(report)}`);
  await post('/end', report);
}
