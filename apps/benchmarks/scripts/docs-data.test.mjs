import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript';

test('partial device runs replace matching variants and retain other published results', () => {
  const exports = {};
  const source = readFileSync(
    new URL('../../../docs/src/data/benchmarks.ts', import.meta.url),
    'utf8'
  );
  const code = transpileModule(source, {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(code, { exports });
  const old = {
    device: 's20plus',
    task: 'llm',
    model: 'test',
    backend: 'xnnpack',
    precision: '8da4w',
    medianMs: 10,
  };
  const fresh = { ...old, medianMs: 5 };
  const otherDevice = { ...old, device: 's26ultra' };
  const otherTask = { ...old, task: 'classification' };
  const otherBackend = { ...old, backend: 'vulkan' };
  const otherPrecision = { ...old, precision: '8da8w' };
  const rows = exports.mergeBenchmarkRows(
    [fresh],
    [old, otherDevice, otherTask, otherBackend, otherPrecision]
  );
  assert.equal(rows.length, 5);
  assert.equal(rows[0], fresh);
  assert.equal(rows[1], otherDevice);
  assert.equal(rows[2], otherTask);
  assert.equal(rows[3], otherBackend);
  assert.equal(rows[4], otherPrecision);
});

test('docs generation publishes valid LLM throughput and rejects missing token stats', () => {
  const page = mkdtempSync(join(tmpdir(), 'rne-docs-test-'));
  try {
    const dir = join(page, 'runs', 'iphone17');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'test.jsonl');
    const header = { type: 'run', label: 'test', device: { model: 'test' } };
    const entry = {
      id: 'llm/test-xnnpack-8-da4-w',
      status: 'ok',
      backend: 'xnnpack',
      precision: '8da4w',
      pipeline: { mean: 100, median: 100 },
      units: 64,
      detail: { timeToFirstTokenMs: 5 },
      taskLoadMs: 10,
      bytes: 1024 ** 2,
      memory: { peakMb: 20 },
    };
    const convert = () =>
      spawnSync(
        process.execPath,
        [fileURLToPath(new URL('./docs-data.mjs', import.meta.url)), page],
        { encoding: 'utf8' }
      );
    const write = (measurement) =>
      writeFileSync(file, `${JSON.stringify(header)}\n${JSON.stringify(measurement)}\n`);
    write(entry);
    const valid = convert();
    assert.equal(valid.status, 0, valid.stderr);
    const [row] = JSON.parse(readFileSync(join(page, 'measured.json'), 'utf8'));
    assert.equal(row.tokensPerSecond, 640);
    assert.equal(row.ttftMs, 5);
    write({ ...entry, units: undefined });
    const invalid = convert();
    assert.equal(invalid.status, 2);
    assert.match(invalid.stderr, /missing valid token or TTFT stats/);
  } finally {
    rmSync(page, { recursive: true, force: true });
  }
});
