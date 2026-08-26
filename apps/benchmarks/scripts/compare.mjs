#!/usr/bin/env node
/**
 * Diffs two benchmark reports and fails on regressions.
 *
 * Usage:
 *   yarn bench:compare results/et-1.3.1-ios-iPhone17,1.json results/et-1.4.1-ios-iPhone17,1.json
 *   yarn bench:compare baseline.json current.json --inference 8 --memory 5
 *
 * Exits 1 when any metric regresses past its tolerance, 0 otherwise.
 *
 * What the tolerances are for: on-device timings are not reproducible to the
 * percent. Thermal state, the scheduler, and whatever else the OS decided to do
 * during the run all move the numbers, which is why the comparator works off
 * medians and treats a delta as real only once it clears both a fixed tolerance
 * and the run's own noise floor (its interquartile range). The defaults are set
 * where a regression is worth a human look rather than where it is certain.
 */

import { readFileSync } from 'node:fs';

// Calibrated against two full-suite runs of identical code on a Galaxy S26
// Ultra, rather than guessed. Measured worst-case drift between those runs, per
// family:
//
//   execute.*          7.6%   (most cases inside 4%)
//   pipeline.median    35%
//   load.*             45%    at one sample per load; less now that loads are
//                             repeated, but still the loosest of the three
//   memory.*           2%
//
// Hence the spread below. `execute.*` is both the tightest and the one that
// actually measures ExecuTorch, which is what a version bump changes; a pipeline
// figure carries TypeScript pre- and post-processing and its garbage collection,
// and a load carries filesystem cache state. Setting one tolerance across all of
// them would either drown the execute signal or report a regression on every
// second run: the first calibration attempt used a flat 10/15% and produced six
// false regressions between two runs of the same build.
const DEFAULT_TOLERANCE = {
  /** Percent regression in raw `model.execute` medians. The primary signal. */
  execute: 10,
  /** Percent regression in end-to-end pipeline medians. */
  pipeline: 30,
  /** Percent regression in model load time. */
  load: 35,
  /** Percent growth in peak footprint. */
  memory: 10,
};

function parseArgs(argv) {
  const files = [];
  const tolerance = { ...DEFAULT_TOLERANCE };
  let allowDeviceMismatch = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--allow-device-mismatch') allowDeviceMismatch = true;
    else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (!(key in tolerance)) throw new Error(`Unknown option ${arg}`);
      tolerance[key] = Number(argv[++i]);
      if (!Number.isFinite(tolerance[key])) throw new Error(`${arg} needs a number`);
    } else files.push(arg);
  }

  if (files.length !== 2) {
    throw new Error('Usage: compare.mjs <baseline.json> <current.json> [--inference N] ...');
  }
  return { files, tolerance, allowDeviceMismatch };
}

const load = (path) => JSON.parse(readFileSync(path, 'utf8'));

const percentDelta = (baseline, current) =>
  baseline === 0 ? 0 : ((current - baseline) / baseline) * 100;

/**
 * Classifies one metric's movement.
 *
 * `noisePercent` is the larger of the two runs' interquartile ranges as a
 * percentage of the baseline. A delta inside that band is reported but not
 * failed: the runs simply cannot distinguish it from scheduling jitter.
 *
 * When that band is itself wider than the tolerance, the metric cannot resolve a
 * regression of the size we care about, and calling it "same" would overstate
 * what the run knows. It is reported as NOISY instead. This is not academic: the
 * YOLO26 pipeline metric on a Galaxy S26 Ultra has an interquartile range around
 * 38% of its own median, from garbage collection during post-processing, and it
 * moved 57% between two runs of identical code. Its `execute.forward` number
 * over the same runs sits inside 1%.
 */
function classify(baseline, current, tolerancePercent, noisePercent = 0) {
  const delta = percentDelta(baseline, current);
  const threshold = Math.max(tolerancePercent, noisePercent);

  if (delta > threshold) return { delta, verdict: 'REGRESSED' };
  if (delta < -threshold) return { delta, verdict: 'improved' };
  if (noisePercent > tolerancePercent) return { delta, verdict: 'NOISY' };
  return { delta, verdict: 'same' };
}

const noiseFloor = (baselineStats, currentStats) => {
  if (!baselineStats?.median) return 0;
  const worst = Math.max(baselineStats.iqr ?? 0, currentStats?.iqr ?? 0);
  return (worst / baselineStats.median) * 100;
};

/** Builds the comparison rows for a single case present in both reports. */
function compareCase(baseline, current, tolerance) {
  const rows = [];
  const add = (metric, before, after, tolerancePercent, noise) => {
    if (typeof before !== 'number' || typeof after !== 'number') return;
    if (before <= 0 || after <= 0) return;
    rows.push({ metric, before, after, ...classify(before, after, tolerancePercent, noise) });
  };

  if (baseline.status !== 'ok' || current.status !== 'ok') {
    return [
      {
        metric: 'status',
        before: baseline.status,
        after: current.status,
        delta: 0,
        verdict: baseline.status === 'ok' && current.status !== 'ok' ? 'REGRESSED' : 'same',
      },
    ];
  }

  // Two runs that produced different amounts of work did not run the same
  // benchmark, so their timings are not comparable at all — reporting a delta
  // would be worse than reporting nothing.
  if (baseline.units !== current.units) {
    return [
      {
        metric: 'workload',
        before: baseline.units,
        after: current.units,
        delta: 0,
        verdict: 'INCOMPARABLE',
      },
    ];
  }

  // Raw execute first: it is the number to read, so it belongs at the top of
  // each case's block rather than below the pipeline figure it explains.
  for (const beforeMethod of baseline.native?.methods ?? []) {
    const afterMethod = (current.native?.methods ?? []).find(
      (entry) => entry.method === beforeMethod.method
    );
    add(
      `execute.${beforeMethod.method}`,
      beforeMethod.stats?.median,
      afterMethod?.stats?.median,
      tolerance.execute,
      noiseFloor(beforeMethod.stats, afterMethod?.stats)
    );
  }

  add(
    'pipeline.median',
    baseline.pipeline?.median,
    current.pipeline?.median,
    tolerance.pipeline,
    noiseFloor(baseline.pipeline, current.pipeline)
  );
  // `taskLoad` and `native.load` arrived in schema 2. A version 1 baseline has
  // only the single-sample number, so there is no spread to fall back on.
  add(
    'load.task',
    baseline.taskLoadMs,
    current.taskLoadMs,
    tolerance.load,
    noiseFloor(baseline.taskLoad, current.taskLoad)
  );
  add(
    'load.native',
    baseline.native?.loadMs,
    current.native?.loadMs,
    tolerance.load,
    noiseFloor(baseline.native?.load, current.native?.load)
  );
  add('memory.peak', baseline.memory?.peakMb, current.memory?.peakMb, tolerance.memory);
  add('memory.loaded', baseline.memory?.loadedMb, current.memory?.loadedMb, tolerance.memory);

  return rows;
}

const pad = (value, width) => String(value).padEnd(width);
const padStart = (value, width) => String(value).padStart(width);

function main() {
  const { files, tolerance, allowDeviceMismatch } = parseArgs(process.argv.slice(2));
  const [baseline, current] = files.map(load);

  console.log(`baseline: ${baseline.label} (${files[0]})`);
  console.log(`current:  ${current.label} (${files[1]})`);
  console.log(
    `device:   ${baseline.device?.model} / ${baseline.platform} ${baseline.device?.osVersion}`
  );

  const sameDevice =
    baseline.device?.model === current.device?.model &&
    baseline.device?.osVersion === current.device?.osVersion;

  if (!sameDevice) {
    const message =
      `device mismatch: ${baseline.device?.model} ${baseline.device?.osVersion} vs ` +
      `${current.device?.model} ${current.device?.osVersion}`;
    if (!allowDeviceMismatch) {
      console.error(`\nERROR: ${message}. Pass --allow-device-mismatch to compare anyway.`);
      process.exit(2);
    }
    console.warn(`\nWARNING: ${message}`);
  }

  // A throttling device is the single largest source of false regressions here.
  // Two full suites run fifteen seconds apart made every raw-execute metric 9%
  // to 51% slower (median 22%) with no code change at all. Nothing downstream
  // can correct for that, so the comparison is refused rather than reported.
  const worstThermal = (report) =>
    report.cases.reduce((worst, entry) => Math.max(worst, entry.thermal?.status ?? -1), -1);

  const baselineHeat = worstThermal(baseline);
  const currentHeat = worstThermal(current);

  if (baselineHeat > 0 || currentHeat > 0) {
    const name = (report) =>
      report.cases.find((entry) => (entry.thermal?.status ?? -1) === worstThermal(report))?.thermal
        ?.statusName ?? 'unknown';
    console.error(
      `\nERROR: a device was throttling during these runs (baseline peaked at ` +
        `"${name(baseline)}", current at "${name(current)}").\n` +
        'Timings taken while throttling are not comparable. Let the device cool and re-run;\n' +
        '`yarn bench --cooldown 600` waits before starting.'
    );
    process.exit(2);
  }

  // A pinned run executes at roughly 2 GHz and an unpinned one boosts past 3.4,
  // so diffing across the two measures the clock rather than the change. This is
  // a hard stop for the same reason throttling is.
  if (Boolean(baseline.clocksPinned) !== Boolean(current.clocksPinned)) {
    const which = (report) => (report.clocksPinned ? 'pinned' : 'unpinned');
    console.error(
      `\nERROR: CPU clock pinning differs between runs (baseline ${which(baseline)}, ` +
        `current ${which(current)}).\n` +
        'Those run at different frequencies and are not comparable. Re-run both the same way;\n' +
        '`yarn bench --pin-clocks on` pins, `--pin-clocks off` disables it.'
    );
    process.exit(2);
  }

  if (baselineHeat !== currentHeat) {
    console.warn(
      `\nWARNING: thermal states differ between runs (${baselineHeat} vs ${currentHeat}).`
    );
  }

  if (baseline.settings?.iterations !== current.settings?.iterations) {
    console.warn(
      `\nWARNING: iteration counts differ (${baseline.settings?.iterations} vs ` +
        `${current.settings?.iterations}); medians are still comparable but noise is not.`
    );
  }

  console.log(
    `\ntolerances: inference ${tolerance.inference}%, load ${tolerance.load}%, ` +
      `memory ${tolerance.memory}%\n`
  );

  const currentById = new Map(current.cases.map((entry) => [entry.id, entry]));
  const regressions = [];
  const incomparable = [];
  const noisy = [];

  for (const baselineCase of baseline.cases) {
    const currentCase = currentById.get(baselineCase.id);
    if (!currentCase) {
      console.log(`${baselineCase.id}\n  missing from the current run\n`);
      continue;
    }

    const rows = compareCase(baselineCase, currentCase, tolerance);
    console.log(baselineCase.id);
    for (const row of rows) {
      const delta =
        row.verdict === 'INCOMPARABLE'
          ? ''
          : `${row.delta >= 0 ? '+' : ''}${row.delta.toFixed(1)}%`;
      console.log(
        `  ${pad(row.metric, 24)} ${padStart(row.before, 10)} -> ${padStart(row.after, 10)}` +
          `  ${padStart(delta, 8)}  ${row.verdict}`
      );
      if (row.verdict === 'REGRESSED') regressions.push(`${baselineCase.id} ${row.metric}`);
      if (row.verdict === 'INCOMPARABLE') incomparable.push(`${baselineCase.id} ${row.metric}`);
      if (row.verdict === 'NOISY') noisy.push(`${baselineCase.id} ${row.metric}`);
    }
    console.log('');
  }

  const added = current.cases.filter((entry) => !baseline.cases.some((e) => e.id === entry.id));
  if (added.length > 0) console.log(`new cases: ${added.map((e) => e.id).join(', ')}\n`);

  if (incomparable.length > 0) {
    console.log(`${incomparable.length} metric(s) could not be compared:`);
    for (const entry of incomparable) console.log(`  ${entry}`);
    console.log('');
  }

  if (noisy.length > 0) {
    console.log(
      `${noisy.length} metric(s) too noisy to resolve a regression at the given tolerance.\n` +
        "Their own spread is wider than the threshold, so read the case's execute.* rows instead:"
    );
    for (const entry of noisy) console.log(`  ${entry}`);
    console.log('');
  }

  if (regressions.length > 0) {
    console.log(`FAIL — ${regressions.length} regression(s):`);
    for (const entry of regressions) console.log(`  ${entry}`);
    process.exit(1);
  }

  console.log('PASS — no regressions past tolerance.');
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
