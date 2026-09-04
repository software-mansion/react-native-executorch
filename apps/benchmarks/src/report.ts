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
 *
 * One measurement is one POST. A whole-estate run takes many hours, and a
 * report assembled only at the end would lose all of it to a crash on the last
 * case; the collector appends each measurement to a JSONL file as it lands, and
 * a resumed run skips what that file already holds.
 */

import type { BenchDeviceInfo, BenchThermalState } from '../modules/bench-probe';
import type { GateResult } from './gate';
import type { NativeResult } from './nativeForward';
import type { Stats } from './stats';
import { config } from './config';
import { INPUT_SPEC_VERSION } from './inputs';

/** Prefix that makes result lines greppable in a log stream. */
export const LOG_PREFIX = 'RNE_BENCH';

const SINK_ATTEMPTS = 3;
const SINK_RETRY_DELAY_MS = 500;

/** How far through the suite a measurement was taken. */
export interface Progress {
  /** 1-based index of this case among the cases that will run. */
  readonly caseIndex: number;
  /** How many cases will run. */
  readonly caseCount: number;
  /** 1-based repeat of this case. */
  readonly repeat: number;
  /** How many repeats each case gets. */
  readonly repeats: number;
}

/** One measurement: one case, one repeat. */
export interface CaseResult {
  readonly id: string;
  readonly task: string;
  /** Full dotted registry path, e.g. `objectDetection.RFDETR_NANO.XNNPACK_FP32`. */
  readonly model: string;
  readonly backend: string;
  readonly precision: string;
  /** Total download size of this variant in bytes. */
  readonly bytes: number;
  readonly status: 'ok' | 'error' | 'skipped';
  /** Failure or skip detail. Present when `status` is not `ok`. */
  readonly error?: string;
  readonly note?: string;
  /** Whether timings came from the worklet runtime or the RN thread. */
  readonly mode: 'worklet' | 'async';
  readonly progress: Progress;
  /** Milliseconds spent resolving remote model files. 0 when fully cached. */
  readonly downloadMs: number;
  /** Median of {@link CaseResult.taskLoad}, kept for readability of the report. */
  readonly taskLoadMs: number;
  /** The task pipeline's `create` timings across repeated load/dispose cycles. */
  readonly taskLoad?: Stats;
  /** End-to-end pipeline timings: preprocessing, execute, and post-processing. */
  readonly pipeline?: Stats;
  /** Workload size the pipeline reported. See `TimedRun.units`. */
  /**
   * ExecuTorch time measured inside the pipeline pass, per iteration.
   *
   * Unlike `native`, this is the same work the pipeline did: same shapes, same
   * number of calls. It is what makes an execute share meaningful for a model
   * with a dynamic dimension, where the standalone pass has to pick a size and
   * picks the maximum.
   */
  readonly execution?: {
    readonly perIteration: Readonly<Record<string, { readonly count: number; readonly ms: number }>>;
    readonly totalMs: number;
  };
  readonly units?: number;
  /** Per-task extras, e.g. an LLM's time to first token. */
  readonly detail?: Record<string, number>;
  /** What the thermal gate did before this measurement. */
  readonly gate?: GateResult;
  /**
   * Thermal state when this measurement's timings were taken. A case measured
   * while the device was throttling is not comparable with one measured cool.
   */
  readonly thermal?: BenchThermalState;
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
  /**
   * Report schema version. Bumped when a field's meaning changes.
   *
   * 2 added `taskLoad` and `native.load`: version 1 timed each load exactly
   * once, and a single sample of a load is not stable enough to compare.
   * 3 made a result one measurement rather than one case, adding `progress`,
   * `gate` and `inputSpecVersion`, and moved case selection onto the generated
   * registry variant list.
   */
  readonly schemaVersion: 3;
  /** Label identifying the build under test, e.g. `et-1.4.1`. */
  readonly label: string;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly platform: string;
  readonly device: BenchDeviceInfo;
  /**
   * Version of `src/inputs.ts`. Two devices are comparable only if they fed the
   * models the same bytes; the comparator refuses to diff across a change here.
   */
  readonly inputSpecVersion: number;
  /** Thermal state at the start and end of the whole run. */
  readonly thermal?: { readonly start: BenchThermalState; readonly end: BenchThermalState };
  /**
   * Whether the driver pinned the CPU to a fixed clock for this run (Android
   * fixed-performance mode). A pinned run and an unpinned one execute at
   * different frequencies, so their timings are not comparable.
   */
  readonly clocksPinned?: boolean;
  readonly settings: {
    readonly suite: string;
    readonly iterations: number;
    readonly warmup: number;
    readonly memoryIterations: number;
    readonly loadIterations: number;
    readonly repeats: number;
    readonly maxTempC: number;
    readonly maxBytes: number;
  };
  /** Variants deliberately not run, with the reason. */
  readonly skipped: readonly { readonly id: string; readonly reason: string }[];
  readonly cases: readonly CaseResult[];
}

const post = async (path: string, body: unknown): Promise<void> => {
  if (!config.sink) return;

  // Retried because the channel is genuinely flaky: on Android the collector is
  // reached through an `adb reverse` tunnel, and that tunnel has been seen to
  // drop partway through a long suite. A single attempt turns a few seconds of
  // lost connectivity into a permanently missing measurement.
  for (let attempt = 0; attempt < SINK_ATTEMPTS; attempt++) {
    try {
      await fetch(`${config.sink}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return;
    } catch (error) {
      if (attempt === SINK_ATTEMPTS - 1) {
        // The collector is optional: a developer running the app by hand has no
        // sink at all. Losing it must not take the run down, and the final
        // report carries every measurement again, so one dropped POST is
        // recoverable.
        console.warn(`${LOG_PREFIX}_SINK_ERROR ${String(error)}`);
        return;
      }
      await new Promise((settle) => setTimeout(settle, SINK_RETRY_DELAY_MS * (attempt + 1)));
    }
  }
};

/**
 * Announces the plan before any work starts.
 * @param plan The cases about to run, the repeats each gets, the variants
 * skipped, and the device, so the collector can name its output file before the
 * first measurement rather than after the last.
 */
export async function reportStart(plan: {
  readonly cases: readonly string[];
  readonly repeats: number;
  readonly skipped: readonly { readonly id: string; readonly reason: string }[];
  readonly device: BenchDeviceInfo;
  readonly platform: string;
}): Promise<void> {
  const body = { label: config.label, inputSpecVersion: INPUT_SPEC_VERSION, ...plan };
  console.log(`${LOG_PREFIX}_BEGIN ${JSON.stringify(body)}`);
  await post('/begin', body);
}

/**
 * Emits one measurement as soon as it is available.
 * @param result The finished measurement.
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

/**
 * Asks the collector which measurements it already holds, so a resumed run
 * does not repeat them.
 * @returns Keys of the form `<caseId>#<repeat>`, or an empty set when there is
 * no collector or it cannot answer.
 */
export async function fetchCompleted(): Promise<Set<string>> {
  if (!config.sink) return new Set();
  try {
    const response = await fetch(`${config.sink}/completed`);
    const body = (await response.json()) as { readonly done?: readonly string[] };
    return new Set(body.done ?? []);
  } catch {
    return new Set();
  }
}
