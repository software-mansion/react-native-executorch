/**
 * The benchmark engine.
 *
 * The run is a loop over cases, and each case is a loop over repeats. A repeat
 * is a complete measurement from a cold pipeline, taken after the device has
 * been cooled back to the gate temperature — which is why repeats are the outer
 * unit of noise here and `iterations` the inner one. Downloads happen once per
 * case and the files are released after its last repeat, so peak disk is one
 * model rather than the whole estate.
 *
 * Within one repeat the passes run in this order, for these reasons:
 *
 * 1. **Raw execute.** Loads the `.pte` on its own and times `model.execute` per
 *    method. Runs before the pipeline pass so it holds the only model in memory
 *    while it runs, and is disposed before the pipeline loads its own copy.
 * 2. **Task load.** Times the pipeline's `create` call — model load, schema
 *    validation and tensor pre-allocation, the thing a user waits through.
 * 3. **Pipeline timing.** Warmup, then timed iterations, with the memory sampler
 *    off so the sampler's cost stays out of the numbers.
 * 4. **Memory.** A few more iterations with the sampler on, for the peak. Split
 *    from pass 3 because reading total PSS on Android is milliseconds of work.
 * 5. **Dispose.** Footprint is read once more, so a leak shows up as a case that
 *    never returns to its baseline.
 */

import {
  download,
  defaultWorkletRuntime,
  models,
  getExecutionProfile,
  resetExecutionProfile,
} from 'react-native-executorch';
import { Platform } from 'react-native';

import BenchProbe from '../modules/bench-probe';
import { config } from './config';
import { waitUntilCool, type GateResult } from './gate';
import { INPUT_SPEC_VERSION } from './inputs';
import { footprintMb, sampleDuring } from './memory';
import { benchmarkNativeForward } from './nativeForward';
import {
  fetchCompleted,
  reportCase,
  reportEnd,
  reportStart,
  type CaseResult,
  type Progress,
  type RunReport,
} from './report';
import { releaseModelFiles } from './storage';
import { summarize } from './stats';
import { timeAsync, timeInWorklet } from './time';
import { resolveConfig, selectCases, type BenchCase } from './suite';

/** Progress callbacks so the on-device UI can show what is happening. */
export interface RunnerEvents {
  onPhase?: (caseId: string, phase: string, progress: Progress) => void;
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

/**
 * The identity fields every result for a case carries, whatever its outcome.
 * @param benchCase The case being measured.
 * @param progress Where the measurement sits in the run.
 * @returns The fields shared by an ok, an error and a skipped result.
 */
function describe(benchCase: BenchCase, progress: Progress) {
  return {
    id: benchCase.id,
    task: benchCase.variant.task,
    model: benchCase.variant.registryPath,
    backend: benchCase.variant.backend,
    precision: benchCase.variant.precision,
    bytes: benchCase.variant.bytes,
    note: benchCase.driver.note,
    mode: benchCase.driver.mode ?? ('worklet' as const),
    progress,
  };
}

/**
 * Takes one measurement of one case.
 * @param benchCase The case to measure.
 * @param resolved Its config, with every URL already a local path.
 * @param downloadMs How long the download took. Charged to the first repeat.
 * @param gate What the thermal gate did before this measurement.
 * @param progress Where this measurement sits in the run.
 * @param events Progress callbacks.
 * @returns The measurement.
 */
async function measureOnce(
  benchCase: BenchCase,
  resolved: any,
  downloadMs: number,
  gate: GateResult,
  progress: Progress,
  events: RunnerEvents
): Promise<CaseResult> {
  const base = describe(benchCase, progress);
  const { driver } = benchCase;

  let native: CaseResult['native'];
  if (config.measureNative && driver.modelPathKey) {
    events.onPhase?.(benchCase.id, 'raw execute', progress);
    const modelPath = resolved[driver.modelPathKey];
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

  events.onPhase?.(benchCase.id, 'load', progress);
  // Repeated for the same reason as the raw load above: one sample of a load is
  // not a measurement. Each cycle disposes the previous instance first, so the
  // last one survives the loop and is what the inference passes run against.
  const loadSamples: number[] = [];
  let instance: any = null;
  for (let cycle = 0; cycle < Math.max(1, config.loadIterations); cycle++) {
    instance?.dispose();
    const loadStarted = performance.now();
    instance = await driver.create(resolved);
    loadSamples.push(performance.now() - loadStarted);
  }

  const taskLoad = summarize(loadSamples);
  const loadedMb = footprintMb();
  const loaded = instance!;

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    loaded.dispose();
  };

  try {
    events.onPhase?.(benchCase.id, 'inference', progress);
    // Reset after the warmups would be wrong and before them is wasteful, so
    // the profile is cleared here and the warmup contribution is divided out
    // along with the timed iterations below.
    resetExecutionProfile();
    const timed =
      driver.mode === 'async'
        ? await timeAsync(driver.runAsync!(loaded), config.iterations, config.warmup)
        : await timeInWorklet(
            defaultWorkletRuntime,
            driver.run!(loaded),
            config.iterations,
            config.warmup
          );

    // What ExecuTorch actually spent during those iterations, at the shapes and
    // call counts the pipeline used. Divided by the number of passes the tally
    // covers, which includes the warmups because they run the model too.
    const passes = config.iterations + config.warmup;
    const profile = getExecutionProfile();
    const execution = {
      perIteration: Object.fromEntries(
        Object.entries(profile).map(([method, entry]) => [
          method,
          { count: entry.count / passes, ms: entry.totalMs / passes },
        ])
      ),
      totalMs:
        Object.values(profile).reduce((sum, entry) => sum + entry.totalMs, 0) / passes,
    };

    // Read before dispose: an LLM's stats live on the session.
    const detail = driver.detail?.(loaded);

    let memory: CaseResult['memory'];
    if (config.measureMemory) {
      events.onPhase?.(benchCase.id, 'memory', progress);
      const sampled = await sampleDuring(async () => {
        if (driver.mode === 'async') {
          return timeAsync(driver.runAsync!(loaded), config.memoryIterations, 0);
        }
        return timeInWorklet(
          defaultWorkletRuntime,
          driver.run!(loaded),
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
      taskLoadMs: taskLoad.median,
      taskLoad,
      pipeline: summarize(timed.durations),
      execution,
      units: timed.units,
      detail,
      gate,
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
      taskLoadMs: taskLoad.median,
      taskLoad,
      gate,
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
  const { cases, skipped } = selectCases({
    suite: config.suite,
    only: config.only,
    maxBytes: config.maxBytes,
    tasks: config.tasks,
    backends: config.backends,
  });

  const startedAt = new Date().toISOString();
  const thermalStart = BenchProbe.thermalState();
  const device = BenchProbe.deviceInfo();
  const platform = Platform.OS;
  const repeats = config.repeats;

  await reportStart({
    cases: cases.map((benchCase) => benchCase.id),
    repeats,
    skipped: skipped.map((entry) => ({ id: entry.id, reason: entry.reason })),
    device,
    platform,
  });

  // A resumed run must not redo what the collector already has: an estate-wide
  // suite takes many hours, and a phone that reboots on case 90 should carry on
  // from 90 rather than from 1.
  const completed = await fetchCompleted();

  const results: CaseResult[] = [];
  const emit = async (result: CaseResult) => {
    results.push(result);
    events.onCase?.(result);
    await reportCase(result);
  };

  for (const [index, benchCase] of cases.entries()) {
    const caseIndex = index + 1;
    const pending = [];
    for (let repeat = 1; repeat <= repeats; repeat++) {
      if (!completed.has(`${benchCase.id}#${repeat}`)) pending.push(repeat);
    }
    if (pending.length === 0) continue;

    const progressFor = (repeat: number): Progress => ({
      caseIndex,
      caseCount: cases.length,
      repeat,
      repeats,
    });

    // Downloaded once and reused by every repeat: the transfer measures the
    // network, and repeating it would add an hour per case for nothing.
    let resolved: any;
    let downloadMs = 0;
    try {
      events.onPhase?.(benchCase.id, 'download', progressFor(pending[0]!));
      const registryConfig = resolveConfig(models, benchCase.variant.registryPath);
      if (registryConfig === undefined) {
        throw new Error(`registry path ${benchCase.variant.registryPath} no longer exists`);
      }
      const downloadStarted = performance.now();
      resolved = await download(registryConfig);
      downloadMs = round(performance.now() - downloadStarted);
    } catch (error) {
      // Every repeat of this case fails identically, and saying so once per
      // repeat keeps the result count equal to the plan.
      for (const repeat of pending) {
        await emit({
          ...describe(benchCase, progressFor(repeat)),
          status: 'error',
          error: `download failed: ${String(error)}`,
          downloadMs: 0,
          taskLoadMs: 0,
        });
      }
      continue;
    }

    for (const repeat of pending) {
      const progress = progressFor(repeat);
      events.onPhase?.(benchCase.id, 'cooling', progress);
      const gate = await waitUntilCool(benchCase.id, repeat, repeats);

      let result: CaseResult;
      try {
        result = await measureOnce(
          benchCase,
          resolved,
          repeat === 1 ? downloadMs : 0,
          gate,
          progress,
          events
        );
      } catch (error) {
        // A case that fails outright — a backend the device does not have, an
        // allocation the phone cannot serve — must not strand the rest.
        result = {
          ...describe(benchCase, progress),
          status: 'error',
          error: String(error),
          downloadMs: repeat === 1 ? downloadMs : 0,
          taskLoadMs: 0,
          gate,
        };
      }
      await emit(result);
    }

    if (!config.keepModels) {
      events.onPhase?.(benchCase.id, 'releasing files', progressFor(repeats));
      await releaseModelFiles(resolved);
    }
  }

  // Recorded so a report shows the whole plan, including what never ran.
  for (const entry of skipped) {
    results.push({
      id: entry.id,
      task: entry.variant.task,
      model: entry.variant.registryPath,
      backend: entry.variant.backend,
      precision: entry.variant.precision,
      bytes: entry.variant.bytes,
      status: 'skipped',
      error: entry.reason,
      mode: 'worklet',
      progress: { caseIndex: 0, caseCount: cases.length, repeat: 0, repeats },
      downloadMs: 0,
      taskLoadMs: 0,
    });
  }

  const report: RunReport = {
    schemaVersion: 3,
    label: config.label,
    startedAt,
    finishedAt: new Date().toISOString(),
    platform,
    device,
    inputSpecVersion: INPUT_SPEC_VERSION,
    thermal: { start: thermalStart, end: BenchProbe.thermalState() },
    settings: {
      suite: config.only.length > 0 ? config.only.join(',') : config.suite,
      iterations: config.iterations,
      warmup: config.warmup,
      memoryIterations: config.memoryIterations,
      loadIterations: config.loadIterations,
      repeats,
      maxTempC: config.maxTempC,
      maxBytes: config.maxBytes,
    },
    skipped: skipped.map((entry) => ({ id: entry.id, reason: entry.reason })),
    cases: results,
  };

  await reportEnd(report);
  return report;
}
