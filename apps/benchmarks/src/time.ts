/**
 * Timing primitives.
 *
 * The measurement loop runs *inside* the worklet runtime rather than driving it
 * from the React Native thread one iteration at a time. Each `runOnRuntimeAsync`
 * hop costs a serialization of the captured closure plus a thread handoff, which
 * is the same order of magnitude as a small model's inference — measuring from
 * outside would bury the signal under harness overhead. Keeping the loop inside
 * means one hop per measurement instead of one per iteration.
 *
 * `performance.now()` is installed on worklet runtimes by react-native-worklets
 * and is backed by `std::chrono::steady_clock`, so it is monotonic and has
 * sub-millisecond resolution. `Date.now()`'s 1 ms granularity would quantize a
 * 4 ms inference into three distinct values.
 */

import { runOnRuntimeAsync, type WorkletRuntime } from 'react-native-worklets';

/**
 * A single measurement's raw output.
 */
export interface TimedRun {
  /** Per-iteration wall time in milliseconds, in execution order. */
  readonly durations: number[];
  /**
   * Workload size reported by the measured function on its last iteration —
   * tokens decoded, boxes kept, samples synthesized. Constant-work benchmarks
   * report 1. The comparator refuses to diff two runs whose units differ, since
   * that means the two did different amounts of work.
   */
  readonly units: number;
}

/**
 * Runs `run` on `runtime`, timing each iteration.
 * @param runtime The worklet runtime to execute on.
 * @param run A worklet returning its workload size. Called `warmup + iterations`
 * times; only the last `iterations` calls are timed.
 * @param iterations Number of timed iterations.
 * @param warmup Number of untimed iterations run first.
 * @returns The per-iteration durations and the final workload size.
 */
export function timeInWorklet(
  runtime: WorkletRuntime,
  run: () => number,
  iterations: number,
  warmup: number
): Promise<TimedRun> {
  return runOnRuntimeAsync(
    runtime,
    (fn: () => number, timed: number, untimed: number) => {
      'worklet';
      for (let i = 0; i < untimed; i++) fn();

      const durations: number[] = [];
      let units = 1;
      for (let i = 0; i < timed; i++) {
        const started = performance.now();
        units = fn();
        durations.push(performance.now() - started);
      }
      return { durations, units };
    },
    run,
    iterations,
    warmup
  );
}

/**
 * Times an asynchronous call from the React Native thread.
 *
 * Only for pipelines with no synchronous worklet entry point — the Supertonic
 * text-to-speech generator, for instance, interleaves worklet chunks with
 * JS-thread orchestration. The numbers include one thread hop per call, so they
 * are comparable across runs but not against `timeInWorklet` results.
 * @param run An async function returning its workload size.
 * @param iterations Number of timed iterations.
 * @param warmup Number of untimed iterations run first.
 * @returns The per-iteration durations and the final workload size.
 */
export async function timeAsync(
  run: () => Promise<number>,
  iterations: number,
  warmup: number
): Promise<TimedRun> {
  for (let i = 0; i < warmup; i++) await run();

  const durations: number[] = [];
  let units = 1;
  for (let i = 0; i < iterations; i++) {
    const started = performance.now();
    units = await run();
    durations.push(performance.now() - started);
  }
  return { durations, units };
}
