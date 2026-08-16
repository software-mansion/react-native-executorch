/**
 * Process-memory instrumentation.
 *
 * Sampling is deliberately kept out of the timing passes. Reading total PSS on
 * Android walks `/proc/self/smaps` and costs single-digit milliseconds; polling
 * that while measuring a 15 ms inference would show up in the numbers. So the
 * runner takes its timings first with the sampler off, then repeats a handful
 * of iterations with it on. The cost is one extra pass, and the payoff is that
 * neither metric is contaminated by the other.
 */

import BenchProbe from '../modules/bench-probe';
import { config } from './config';

const BYTES_PER_MB = 1024 * 1024;

const toMb = (bytes: number): number =>
  bytes < 0 ? -1 : Math.round((bytes / BYTES_PER_MB) * 100) / 100;

/**
 * Reads the current process footprint.
 * @returns The footprint in MB, or -1 when the platform read failed.
 */
export const footprintMb = (): number => toMb(BenchProbe.memoryFootprintBytes());

/**
 * Reads the current native heap allocation.
 * @returns The allocation in MB, or -1 when the platform read failed.
 */
export const nativeHeapMb = (): number => toMb(BenchProbe.nativeHeapBytes());

export interface MemorySample {
  /** Highest footprint observed across the sampling window, in MB. */
  readonly peakMb: number;
  /** Footprint at the moment sampling started, in MB. */
  readonly startMb: number;
  /** Footprint at the moment sampling stopped, in MB. */
  readonly endMb: number;
  /** Number of polls taken. A very low count means the window was short. */
  readonly samples: number;
}

/**
 * Polls the process footprint on the JS thread for the duration of `body`.
 *
 * Inference runs on the worklet runtime's own thread, so the JS thread is free
 * to poll without blocking the work being measured.
 * @typeParam T The result type of `body`.
 * @param body The work to sample across.
 * @returns The work's result alongside the sampled footprint window.
 */
export async function sampleDuring<T>(
  body: () => Promise<T>
): Promise<{ result: T; memory: MemorySample }> {
  const startMb = footprintMb();
  let peakMb = startMb;
  let samples = 1;

  const timer = setInterval(() => {
    const current = footprintMb();
    samples += 1;
    if (current > peakMb) peakMb = current;
  }, config.sampleIntervalMs);

  try {
    const result = await body();
    const endMb = footprintMb();
    if (endMb > peakMb) peakMb = endMb;
    return { result, memory: { peakMb, startMb, endMb, samples } };
  } finally {
    clearInterval(timer);
  }
}
