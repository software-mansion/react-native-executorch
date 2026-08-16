/**
 * The benchmark engine.
 *
 * Each case runs through a fixed sequence of passes, in this order and for these
 * reasons:
 *
 * 1. **Download.** Timed separately and reported, but never part of a metric —
 *    it measures the network, not the build. Cached after the first run.
 * 2. **Raw execute.** Loads the `.pte` on its own and times `model.execute` per
 *    method. Runs before the pipeline pass so it holds the only model in memory
 *    while it runs, and is disposed before the pipeline loads its own copy.
 * 3. **Task load.** Times the pipeline's `create` call — model load, schema
 *    validation and tensor pre-allocation, the thing a user waits through.
 * 4. **Pipeline timing.** Warmup, then timed iterations, with the memory sampler
 *    off so the sampler's cost stays out of the numbers.
 * 5. **Memory.** A few more iterations with the sampler on, for the peak. Split
 *    from pass 4 because reading total PSS on Android is milliseconds of work.
 * 6. **Dispose.** Footprint is read once more, so a leak shows up as a case that
 *    never returns to its baseline.
 */

import { download, defaultWorkletRuntime } from 'react-native-executorch';
import { Platform } from 'react-native';

import BenchProbe from '../modules/bench-probe';
import { config } from './config';
import { footprintMb, sampleDuring } from './memory';
import { benchmarkNativeForward } from './nativeForward';
import { reportCase, reportEnd, reportStart, type CaseResult, type RunReport } from './report';
import { summarize } from './stats';
import { timeAsync, timeInWorklet } from './time';
import { selectCases, type BenchCase } from './suite';

/** Progress callback so the on-device UI can show what is happening. */
export interface RunnerEvents {
  onPhase?: (caseId: string, phase: string) => void;
  onCase?: (result: CaseResult) => void;
}

const round = (value: number): number => Math.round(value * 1000) / 1000;

/**
 * Gives the allocator and the OS a moment to settle before a footprint reading.
 *
 * Freed native memory is not returned to the kernel synchronously, so reading
 * the footprint the instant after `dispose` mostly measures how far behind the
 * allocator is rather than whether anything leaked.
 * @returns A promise resolving once the pause has elapsed.
 */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 250));

async function runCase(benchCase: BenchCase, events: RunnerEvents): Promise<CaseResult> {
  const base = {
    id: benchCase.id,
    task: benchCase.task,
    model: benchCase.model,
    note: benchCase.note,
    mode: benchCase.mode ?? ('worklet' as const),
  };

  events.onPhase?.(benchCase.id, 'download');
  const downloadStarted = performance.now();
  const resolved = await download(benchCase.config);
  const downloadMs = round(performance.now() - downloadStarted);

  let native: CaseResult['native'];
  if (config.measureNative && benchCase.modelPathKey) {
    events.onPhase?.(benchCase.id, 'raw execute');
    const modelPath = resolved[benchCase.modelPathKey];
    if (typeof modelPath === 'string') {
      native = await benchmarkNativeForward(
        modelPath,
        config.iterations,
        config.warmup,
        config.loadIterations
      );
      await settle();
    }
  }

  // Read after the raw-execute pass, not before it. That pass loads and disposes
  // a model of its own, and the allocator does not hand every page back; a
  // baseline taken ahead of it would charge whatever it retained to the pipeline.
  const baselineMb = footprintMb();

  events.onPhase?.(benchCase.id, 'load');
  // Repeated for the same reason as the raw load above: one sample of a load is
  // not a measurement. Each cycle disposes the previous instance first, so the
  // last one survives the loop and is what the inference passes run against.
  const loadSamples: number[] = [];
  let instance: Awaited<ReturnType<typeof benchCase.create>> | null = null;
  for (let cycle = 0; cycle < Math.max(1, config.loadIterations); cycle++) {
    instance?.dispose();
    const loadStarted = performance.now();
    instance = await benchCase.create(resolved);
    loadSamples.push(performance.now() - loadStarted);
  }

  const taskLoad = summarize(loadSamples);
  const taskLoadMs = taskLoad.median;
  const loadedMb = footprintMb();
  const loaded = instance!;

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    loaded.dispose();
  };

  try {
    events.onPhase?.(benchCase.id, 'inference');
    const timed =
      benchCase.mode === 'async'
        ? await timeAsync(benchCase.runAsync(loaded), config.iterations, config.warmup)
        : await timeInWorklet(
            defaultWorkletRuntime,
            benchCase.run(loaded),
            config.iterations,
            config.warmup
          );

    let memory: CaseResult['memory'];
    if (config.measureMemory) {
      events.onPhase?.(benchCase.id, 'memory');
      const sampled = await sampleDuring(async () => {
        if (benchCase.mode === 'async') {
          return timeAsync(benchCase.runAsync(loaded), config.memoryIterations, 0);
        }
        return timeInWorklet(
          defaultWorkletRuntime,
          benchCase.run(loaded),
          config.memoryIterations,
          0
        );
      });

      dispose();
      await settle();
      memory = {
        baselineMb,
        loadedMb,
        peakMb: sampled.memory.peakMb,
        disposedMb: footprintMb(),
      };
    } else {
      dispose();
    }

    return {
      ...base,
      status: 'ok',
      downloadMs,
      taskLoadMs,
      taskLoad,
      pipeline: summarize(timed.durations),
      units: timed.units,
      thermal: BenchProbe.thermalState(),
      native,
      memory,
    };
  } catch (error) {
    dispose();
    return {
      ...base,
      status: 'error',
      error: String(error),
      downloadMs,
      taskLoadMs,
      taskLoad,
      native,
    };
  }
}

/**
 * Runs the configured suite and emits a report.
 * @param events Progress callbacks for the on-device UI.
 * @returns The completed report, also sent to the console and the collector.
 */
export async function runSuite(events: RunnerEvents = {}): Promise<RunReport> {
  const cases = selectCases(config.suite, config.only);
  const startedAt = new Date().toISOString();
  const thermalStart = BenchProbe.thermalState();

  await reportStart(cases.map((benchCase) => benchCase.id));

  const results: CaseResult[] = [];
  for (const benchCase of cases) {
    let result: CaseResult;
    try {
      result = await runCase(benchCase, events);
    } catch (error) {
      // A case that fails outright — a download timeout, a backend the device
      // does not have — must not strand the rest of the suite.
      result = {
        id: benchCase.id,
        task: benchCase.task,
        model: benchCase.model,
        note: benchCase.note,
        mode: benchCase.mode ?? 'worklet',
        status: 'error',
        error: String(error),
        downloadMs: 0,
        taskLoadMs: 0,
      };
    }

    results.push(result);
    events.onCase?.(result);
    await reportCase(result);
  }

  const report: RunReport = {
    schemaVersion: 2,
    label: config.label,
    startedAt,
    finishedAt: new Date().toISOString(),
    platform: Platform.OS,
    device: BenchProbe.deviceInfo(),
    thermal: { start: thermalStart, end: BenchProbe.thermalState() },
    settings: {
      suite: config.only.length > 0 ? config.only.join(',') : config.suite,
      iterations: config.iterations,
      warmup: config.warmup,
      memoryIterations: config.memoryIterations,
      loadIterations: config.loadIterations,
    },
    cases: results,
  };

  await reportEnd(report);
  return report;
}
