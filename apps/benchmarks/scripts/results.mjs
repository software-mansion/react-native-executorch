/**
 * Reading a run back from disk, in either format the collector writes.
 *
 * The `.jsonl` is the primary record: one measurement per line, appended as
 * each lands, plus a `{"type":"run"}` header line written when the app
 * announces itself (and again on every resume or relaunch). The header carries
 * what makes two runs comparable — device, input spec, build type, clock
 * pinning, settings — so a `.jsonl` alone is enough to summarise or compare.
 * The `.json` is the same data assembled into one report at the end of a run.
 */

import { readFileSync } from 'node:fs';

/** The fields of a run header that decide whether two runs are comparable. */
export const COMPARABILITY_FIELDS = [
  ['platform', (run) => run.platform],
  ['device', (run) => run.device?.model],
  ['os', (run) => run.device?.osVersion],
  ['input spec', (run) => run.inputSpecVersion],
  ['build type', (run) => run.buildType],
  ['clock pinning', (run) => Boolean(run.clocksPinned)],
  ['iterations', (run) => run.settings?.iterations],
  ['warmup', (run) => run.settings?.warmup],
  ['url map', (run) => JSON.stringify(run.settings?.urlMap ?? {})],
];

/**
 * Lists the comparability fields on which two run headers disagree.
 * @param a One run header.
 * @param b The other.
 * @returns `field: a != b` strings, empty when the two agree.
 */
export function headerMismatches(a, b) {
  const out = [];
  for (const [name, pick] of COMPARABILITY_FIELDS) {
    if (pick(a) !== pick(b)) out.push(`${name}: ${pick(a)} != ${pick(b)}`);
  }
  return out;
}

/**
 * Parses a JSONL file into its header and its measurements.
 * @param raw The file's contents.
 * @returns The first run header (or null) and every measurement line.
 */
export function parseJsonl(raw) {
  let header = null;
  const cases = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      // A half-written last line after a kill; everything before it stands.
      continue;
    }
    if (entry.type === 'run') header ??= entry;
    else cases.push(entry);
  }
  return { header, cases };
}

/**
 * Keeps one measurement per `(case, repeat)`: the last success if there is one,
 * otherwise the last attempt. A resumed or relaunched run retries what failed,
 * and the failed attempt it replaced is history, not a second repeat.
 * @param cases Measurements in file order.
 * @returns The deduplicated measurements, in first-seen order.
 */
function settled(cases) {
  const byKey = new Map();
  for (const entry of cases) {
    const key = `${entry.id}#${entry.progress?.repeat ?? 1}`;
    const seen = byKey.get(key);
    if (!seen || entry.status === 'ok' || seen.status !== 'ok') byKey.set(key, entry);
  }
  return [...byKey.values()];
}

/**
 * Loads a run from either output format.
 * @param path A `.json` report or a `.jsonl` measurement log.
 * @returns The report: run metadata plus `cases`.
 */
export function loadRun(path) {
  const raw = readFileSync(path, 'utf8');
  if (!path.endsWith('.jsonl')) {
    const report = JSON.parse(raw);
    return { path, ...report, cases: settled(report.cases) };
  }
  const { header, cases } = parseJsonl(raw);
  // Measurements carry no schema version of their own; the collector wrote them
  // as one row per repeat, which is schema 3.
  return { path, schemaVersion: 3, ...(header ?? {}), cases: settled(cases) };
}

/**
 * Whether a measurement started warmer than the run's ceiling allowed.
 * @param entry One measurement.
 * @returns True when the gate or a between-iteration hold gave up.
 */
export const startedWarm = (entry) => entry.thermalValid === false || entry.gate?.timedOut === true;

export const median = (values) => {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
