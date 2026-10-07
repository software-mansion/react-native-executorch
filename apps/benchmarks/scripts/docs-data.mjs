#!/usr/bin/env node
/**
 * Builds the docs benchmark data from raw runs.
 *
 * The raw runs are the source of truth and live beside the docs page, one
 * directory per device: `runs/<deviceId>/*.jsonl`, where `<deviceId>` is the
 * id the docs list the device under. A docs version cut copies them along with
 * the page, so every release keeps the runs its numbers came from, and
 * `bench:compare` can diff a new run against any of them.
 *
 * This writes `measured.json` beside them. The page merges it with
 * `imported.json`, the published rows that have no raw runs behind them: a
 * device with runs here replaces its imported rows entirely.
 *
 * Usage:
 *   yarn bench:docs                       # ../../docs/docs/04-benchmarks
 *   yarn bench:docs <benchmarks page dir>
 */

import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadRun, median, startedWarm } from './results.mjs';

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PAGE_DIR = resolve(process.argv[2] ?? join(APP_ROOT, '../../docs/docs/04-benchmarks'));
const RUNS_DIR = join(PAGE_DIR, 'runs');

const round = (value, digits = 0) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value * 10 ** digits) / 10 ** digits
    : undefined;

/**
 * Splits a case id into the task and model names the docs use.
 * @param entry One measurement.
 * @returns `{ task, model }`, e.g. `object-detection` and `yolo26-nano-size-384`.
 */
function names(entry) {
  const [task, rest] = entry.id.split('/');
  const at = rest.indexOf(`-${entry.backend}`);
  return { task, model: at > 0 ? rest.slice(0, at) : rest };
}

/**
 * Reduces one variant's successful repeats to a docs row.
 * @param deviceId The docs device id.
 * @param entries The variant's `ok` measurements on that device.
 * @returns The row, in the shape `BenchmarkRow` declares.
 */
function toRow(deviceId, entries) {
  const pick = (get) =>
    median(entries.map(get).filter((value) => typeof value === 'number' && value > 0));
  const first = entries[0];
  const { task, model } = names(first);
  const medianMs = pick((entry) => entry.pipeline?.median);
  const meanMs = pick((entry) => entry.pipeline?.mean);
  const row = {
    task,
    model,
    backend: first.backend,
    precision: first.precision,
    device: deviceId,
    medianMs: round(medianMs, 2),
    meanMs: round(meanMs, 2),
  };

  if (task === 'llm') {
    // `units` is the runner's generated-token count over a pinned-length
    // generation: 63 for 64 new tokens, the first coming from prefill.
    row.tokensPerSecond = round(first.units / (medianMs / 1000), 1);
    row.ttftMs = round(pick((entry) => entry.detail?.timeToFirstTokenMs));
  } else {
    const etMs = pick((entry) => entry.execution?.totalMs);
    row.etMs = round(etMs, 2);
    row.share = etMs && meanMs ? round((etMs / meanMs) * 100) : undefined;
  }

  row.peakMb = round(pick((entry) => entry.memory?.peakMb));
  row.loadMs = round(pick((entry) => entry.taskLoadMs));
  // MiB, which is what every published row uses.
  row.sizeMb = first.bytes ? round(first.bytes / 2 ** 20) : undefined;
  return row;
}

function main() {
  if (!existsSync(RUNS_DIR)) {
    throw new Error(`no runs directory at ${RUNS_DIR}`);
  }

  const rows = [];
  for (const deviceId of readdirSync(RUNS_DIR).sort()) {
    const files = readdirSync(join(RUNS_DIR, deviceId))
      .filter((name) => name.endsWith('.jsonl'))
      .sort();
    // Later files win on a variant measured twice, e.g. a re-run of one task.
    const byId = new Map();
    for (const file of files) {
      for (const entry of loadRun(join(RUNS_DIR, deviceId, file)).cases) {
        if (entry.status !== 'ok') continue;
        const list = byId.get(entry.id)?.file === file ? byId.get(entry.id).entries : [];
        list.push(entry);
        byId.set(entry.id, { file, entries: list });
      }
    }

    const warm = [];
    for (const [id, { entries }] of byId) {
      if (entries.some(startedWarm)) warm.push(id);
      rows.push(toRow(deviceId, entries));
    }
    console.log(`[docs] ${deviceId}: ${byId.size} variants from ${files.length} file(s)`);
    if (warm.length > 0) {
      console.warn(`[docs] ${deviceId}: started above the thermal ceiling: ${warm.join(', ')}`);
    }
  }

  const out = join(PAGE_DIR, 'measured.json');
  writeFileSync(out, `${JSON.stringify(rows, null, 2)}\n`);
  console.log(`[docs] wrote ${rows.length} rows to ${out}`);
}

try {
  main();
} catch (error) {
  console.error(`[docs] ${error.message}`);
  process.exit(2);
}
