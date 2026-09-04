#!/usr/bin/env node
/**
 * Turns a run into the table people actually read: one row per variant, with
 * inference time and peak memory, taken across the repeats.
 *
 * Reads either the final `.json` report or the `.jsonl` a run appends to as it
 * goes, so a suite still in progress can be summarised without stopping it.
 *
 * Usage:
 *   yarn bench:summary results/et-1.4.1-android-SM-S948B.jsonl
 *   yarn bench:summary results/*.jsonl --format csv > benchmarks.csv
 *   yarn bench:summary a.jsonl b.jsonl            # devices side by side
 *
 * Each timing column is the **median across repeats**, with the spread shown as
 * the percentage range between the fastest and slowest repeat. The spread is
 * the honest part: a variant whose three cold runs disagree by 40% has not been
 * measured to within 40%, and printing only the median would hide that.
 */

import { readFileSync } from 'node:fs';

function parseArgs(argv) {
  const files = [];
  const options = { format: 'markdown', sort: 'registry' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--format') options.format = argv[++i];
    else if (arg === '--sort') options.sort = argv[++i];
    else if (arg.startsWith('--')) throw new Error(`Unknown option ${arg}`);
    else files.push(arg);
  }
  if (files.length === 0) throw new Error('Usage: summarize.mjs <report.jsonl|report.json> ...');
  if (!['markdown', 'csv'].includes(options.format)) {
    throw new Error(`--format must be markdown or csv, got ${options.format}`);
  }
  return { files, options };
}

/**
 * Loads a run from either output format.
 * @param path A `.json` report or a `.jsonl` measurement log.
 * @returns The measurements and whatever run metadata is available.
 */
function loadRun(path) {
  const raw = readFileSync(path, 'utf8');
  if (path.endsWith('.jsonl')) {
    const cases = [];
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        cases.push(JSON.parse(line));
      } catch {
        // A half-written last line after a kill; everything before it stands.
      }
    }
    return { path, label: null, device: null, cases };
  }
  const report = JSON.parse(raw);
  return { path, label: report.label, device: report.device, platform: report.platform, cases: report.cases };
}

const median = (values) => {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** Range between the fastest and slowest repeat, as a percentage of the median. */
const spreadPercent = (values) => {
  const mid = median(values);
  if (mid === undefined || mid === 0 || values.length < 2) return 0;
  return ((Math.max(...values) - Math.min(...values)) / mid) * 100;
};

/**
 * Groups measurements by case and reduces the repeats to one row.
 * @param run A loaded run.
 * @returns One row per variant, in first-seen order.
 */
function rowsFor(run) {
  const groups = new Map();
  for (const entry of run.cases) {
    const list = groups.get(entry.id) ?? [];
    list.push(entry);
    groups.set(entry.id, list);
  }

  const rows = [];
  for (const [id, entries] of groups) {
    const first = entries[0];
    const ok = entries.filter((entry) => entry.status === 'ok');

    if (ok.length === 0) {
      rows.push({
        id,
        task: first.task,
        model: first.model,
        backend: first.backend,
        precision: first.precision,
        sizeMb: first.bytes ? first.bytes / 1e6 : undefined,
        status: first.status === 'skipped' ? 'skipped' : 'failed',
        detail: first.error,
      });
      continue;
    }

    const pipeline = ok.map((entry) => entry.pipeline?.median).filter((v) => typeof v === 'number');
    const load = ok.map((entry) => entry.taskLoadMs).filter((v) => typeof v === 'number');
    const peak = ok.map((entry) => entry.memory?.peakMb).filter((v) => typeof v === 'number');
    const loaded = ok.map((entry) => entry.memory?.loadedMb).filter((v) => typeof v === 'number');

    // Every case runs in one process, and the baseline creeps upward through a
    // suite as the allocator and the JS heap settle at a higher water mark
    // (292 MB to 350 MB over seven measurements on an S26 Ultra). Absolute peak
    // therefore charges a model measured late for the cases before it. The
    // difference from the baseline read immediately before the model loaded is
    // the model's own cost, and it is markedly steadier: 108.1 / 108.2 / 108.3
    // MB across three repeats where the absolute figure moved with the run.
    const modelPeak = ok
      .map((entry) =>
        entry.memory ? entry.memory.peakMb - entry.memory.baselineMb : undefined
      )
      .filter((v) => typeof v === 'number');
    // A dispose that does not return to the baseline is a leak, and it is the
    // one memory number worth failing on rather than merely reporting.
    const retained = ok
      .map((entry) =>
        entry.memory ? entry.memory.disposedMb - entry.memory.baselineMb : undefined
      )
      .filter((v) => typeof v === 'number');

    // ExecuTorch time measured inside the pipeline pass, so it covers exactly
    // the work the pipeline did.
    //
    // The older `native` pass is kept in the report but is not used here. It
    // runs each method once at its schema maximum, which for a model with a
    // dynamic dimension is not what the pipeline ran: a text embedder declaring
    // 510 tokens was benchmarked at 510 while the pipeline fed 75, so the share
    // came out above 100% and had to be suppressed. Measuring in place removes
    // the mismatch, and it also handles a pipeline that calls one method many
    // times, which a single replay cannot.
    //
    // Falls back to the replay pass for measurements taken before the in-band
    // profiler existed. That fallback is only sound for a static-shape model,
    // where the replay necessarily ran what the pipeline ran; a dynamic-shape
    // model measured the old way is exactly the case the profiler was added
    // for, and is filtered out below by the same rule as before.
    const executeTotal = ok
      .map((entry) => {
        if (typeof entry.execution?.totalMs === 'number') return entry.execution.totalMs;
        const replay = (entry.native?.methods ?? []).reduce(
          (sum, method) => sum + (method.stats?.median ?? 0),
          0
        );
        return replay > 0 ? replay : undefined;
      })
      .filter((value) => typeof value === 'number' && value > 0);
    const inBand = ok.every((entry) => typeof entry.execution?.totalMs === 'number');

    // Where the time actually goes, which is the question that decides what to
    // optimise: a model that is 90% ExecuTorch wants a better export, one that
    // is 70% TypeScript wants better pre- and post-processing, and the two are
    // completely different pieces of work.
    //
    // Both figures now describe the same work, so a share is always meaningful.
    // A model that is essentially all ExecuTorch can still measure a hair over
    // 100% because the pipeline clock starts inside JS and stops after the
    // native call returns; that is noise on the order of a scheduling quantum,
    // so it is clamped rather than discarded — dropping the row would hide
    // exactly the models most worth knowing about.
    const pipelineMs = median(pipeline);
    const executeMs = median(executeTotal);
    // In-band numbers are always comparable. Replayed ones only when they did
    // not overshoot, which is the old dynamic-shape guard.
    const comparable =
      typeof pipelineMs === 'number' &&
      typeof executeMs === 'number' &&
      (inBand || executeMs <= pipelineMs);

    rows.push({
      id,
      task: first.task,
      model: first.model,
      backend: first.backend,
      precision: first.precision,
      sizeMb: first.bytes ? first.bytes / 1e6 : undefined,
      status: ok.length === entries.length ? 'ok' : `ok ${ok.length}/${entries.length}`,
      runs: entries.length,
      pipelineMs,
      pipelineSpread: spreadPercent(pipeline),
      executeMs,
      executeSpread: spreadPercent(executeTotal),
      overheadMs: comparable ? Math.max(pipelineMs - executeMs, 0) : undefined,
      executeShare: comparable ? Math.min((executeMs / pipelineMs) * 100, 100) : undefined,
      loadMs: median(load),
      peakMb: median(peak),
      modelPeakMb: median(modelPeak),
      retainedMb: median(retained),
      loadedMb: median(loaded),
      units: ok[0].units,
      detail: ok[0].detail,
    });
  }
  return rows;
}

const num = (value, digits = 1) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '';

const COLUMNS = [
  { key: 'id', header: 'Variant', get: (row) => row.id },
  { key: 'backend', header: 'Backend', get: (row) => row.backend },
  { key: 'precision', header: 'Precision', get: (row) => row.precision },
  { key: 'sizeMb', header: 'Size MB', get: (row) => num(row.sizeMb, 0) },
  { key: 'loadMs', header: 'Load ms', get: (row) => num(row.loadMs, 0) },
  { key: 'pipelineMs', header: 'Inference ms', get: (row) => num(row.pipelineMs, 2) },
  { key: 'pipelineSpread', header: 'Spread %', get: (row) => num(row.pipelineSpread, 0) },
  { key: 'executeMs', header: 'Execute ms', get: (row) => num(row.executeMs, 2) },
  {
    key: 'overheadMs',
    header: 'JS ms',
    get: (row) => num(row.overheadMs, 2),
  },
  {
    key: 'executeShare',
    header: 'Execute %',
    // The one number that says which half to optimise.
    get: (row) => (row.executeShare === undefined ? '?' : num(row.executeShare, 0)),
  },
  { key: 'modelPeakMb', header: 'Model MB', get: (row) => num(row.modelPeakMb, 0) },
  { key: 'peakMb', header: 'Proc peak MB', get: (row) => num(row.peakMb, 0) },
  {
    key: 'retainedMb',
    header: 'Retained MB',
    // Only worth a column when it is non-trivial: a few MB is the allocator
    // being lazy, tens of MB is a model that did not let go.
    get: (row) => (row.retainedMb > 5 ? num(row.retainedMb, 0) : ''),
  },
  { key: 'runs', header: 'Runs', get: (row) => (row.runs === undefined ? '' : String(row.runs)) },
  { key: 'status', header: 'Status', get: (row) => (row.status === 'ok' ? '' : row.status) },
];

function renderMarkdown(runs) {
  const out = [];
  for (const run of runs) {
    const rows = rowsFor(run);
    const device = run.device?.model ?? 'unknown device';
    out.push(`## ${run.label ?? run.path} — ${device}`);
    out.push('');
    out.push(`| ${COLUMNS.map((column) => column.header).join(' | ')} |`);
    out.push(`| ${COLUMNS.map(() => '---').join(' | ')} |`);
    for (const row of rows) {
      out.push(`| ${COLUMNS.map((column) => column.get(row) || '').join(' | ')} |`);
    }
    out.push('');

    const failed = rows.filter((row) => row.status === 'failed');
    if (failed.length > 0) {
      out.push(`### Failed (${failed.length})`);
      out.push('');
      for (const row of failed) out.push(`- \`${row.id}\` — ${row.detail}`);
      out.push('');
    }
  }
  return out.join('\n');
}

function renderCsv(runs) {
  const out = [['run', 'device', ...COLUMNS.map((column) => column.key)].join(',')];
  for (const run of runs) {
    for (const row of rowsFor(run)) {
      const cells = [
        run.label ?? run.path,
        run.device?.model ?? '',
        ...COLUMNS.map((column) => column.get(row)),
      ];
      out.push(cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','));
    }
  }
  return out.join('\n');
}

function main() {
  const { files, options } = parseArgs(process.argv.slice(2));
  const runs = files.map(loadRun);
  console.log(options.format === 'csv' ? renderCsv(runs) : renderMarkdown(runs));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
