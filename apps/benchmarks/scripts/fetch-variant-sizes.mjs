#!/usr/bin/env node
/**
 * Refreshes the cached download size of every file the registry publishes.
 *
 * The suite has to cover every variant the library publishes, and hand-writing
 * that list would guarantee it goes stale: a variant added to `models.ts` and
 * not to the suite is a model that silently never gets benchmarked, which is
 * the failure mode this harness exists to avoid. So the list is derived from
 * `models.ts` itself and committed, and CI can diff a regeneration against the
 * committed file to prove they still agree.
 *
 * Reading `models.ts` means evaluating it, not parsing it: variants are built
 * through `variants()` and `family()` helpers and assembled from shared option
 * objects, so the URLs a static reader would have to reconstruct only exist
 * once the module has run. It is evaluated under Node's type stripping with the
 * three React-Native-only imports stubbed.
 *
 * Usage:
 *   node scripts/fetch-variant-sizes.mjs
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_SRC = resolve(APP_ROOT, '../../packages/react-native-executorch/src');
const SIZE_CACHE = join(APP_ROOT, 'scripts/variant-sizes.json');


/**
 * Evaluates `models.ts` in Node and returns its `models` export.
 *
 * `models.ts` imports three things that only exist inside a React Native app —
 * `Platform`, the JSI bridge and `getRegisteredBackends`. They are stubbed
 * rather than mocked away because their only role here is resolving `DEFAULT`,
 * and `DEFAULT` is discarded. The stub claims every backend so the module takes
 * its widest path and no variant is dropped before it can be enumerated.
 * @returns The registry object, exactly as an app would see it.
 */
function loadRegistry() {
  const scratch = mkdtempSync(join(tmpdir(), 'rne-variants-'));
  try {
    const models = readFileSync(join(PACKAGE_SRC, 'models.ts'), 'utf8')
      .replace("import { Platform } from 'react-native';", "import { Platform } from './_stub.ts';")
      .replace(
        "import { rnexecutorchJsi } from './native/bridge';",
        "import { rnexecutorchJsi } from './_stub.ts';"
      )
      .replace(
        "import { getRegisteredBackends } from './utils';",
        "import { getRegisteredBackends } from './_stub.ts';"
      )
      .replace(
        "} from './extensions/speech/tasks/whisperSpeechToText';",
        "} from './_stub.ts';"
      )
      .replace("} from './constants';", "} from './constants.ts';")
      // Type-only imports name files that are not copied into the scratch dir.
      // Node strips the annotations but still resolves the specifier, so they
      // have to go.
      .replace(/^import type \{[\s\S]*?\} from '[^']*';\n/gm, '')
      .replace(/^import type [^\n]*;\n/gm, '');

    writeFileSync(join(scratch, 'models.ts'), models);
    writeFileSync(
      join(scratch, 'constants.ts'),
      readFileSync(join(PACKAGE_SRC, 'constants.ts'), 'utf8')
    );
    writeFileSync(
      join(scratch, '_stub.ts'),
      [
        "export const Platform = { OS: 'android' };",
        'export const rnexecutorchJsi = { isEmulator: false };',
        "export const getRegisteredBackends = () => ['XnnpackBackend', 'CoreMLBackend', 'MLXBackend', 'VulkanBackend'];",
        "export const WHISPER_LANGUAGES = ['en'];",
        'export const WhisperSttModel = undefined;',
        '',
      ].join('\n')
    );
    writeFileSync(
      join(scratch, 'dump.mjs'),
      [
        "import { models } from './models.ts';",
        'console.log(JSON.stringify(models));',
        '',
      ].join('\n')
    );

    const result = spawnSync(process.execPath, ['--experimental-strip-types', 'dump.mjs'], {
      cwd: scratch,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
      // Node prints an ExperimentalWarning for type stripping on some versions.
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
    });
    if (result.status !== 0) {
      throw new Error(`could not evaluate models.ts:\n${result.stderr}`);
    }
    return JSON.parse(result.stdout);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

const isRemote = (value) => typeof value === 'string' && value.startsWith('https://');

/** Every remote URL inside a config, in a stable order. */
function remoteFiles(node) {
  const found = [];
  const walk = (value) => {
    if (isRemote(value)) {
      found.push(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(node);
  return [...new Set(found)].sort();
}

/**
 * Measures every file over HTTP, so the suite can skip a variant too large for
 * the device before spending the download on finding out.
 * @param urls Every remote URL in the registry.
 * @param cached Previously measured sizes, reused for URLs that have not moved.
 * @returns A URL-to-bytes map. An unmeasurable URL maps to 0.
 */
async function measure(urls, cached) {
  const sizes = { ...cached };
  const pending = urls.filter((url) => !(url in sizes) || sizes[url] <= 0);
  if (pending.length === 0) return sizes;

  process.stderr.write(`[variants] measuring ${pending.length} files\n`);
  const queue = [...pending];
  const workers = Array.from({ length: 12 }, async () => {
    for (let url = queue.pop(); url !== undefined; url = queue.pop()) {
      try {
        const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        // Hugging Face serves LFS objects through a redirect and reports the
        // real object size in this header; Content-Length on the redirect hop
        // describes the pointer, not the file.
        const linked = response.headers.get('x-linked-size');
        const length = response.headers.get('content-length');
        sizes[url] = Number(linked ?? length ?? 0) || 0;
      } catch {
        sizes[url] = 0;
      }
    }
  });
  await Promise.all(workers);
  return sizes;
}

main().catch((error) => {
  console.error(`[variants] ${error.message}`);
  process.exit(2);
});

/**
 * Walks the registry for every remote URL and measures each one.
 * @returns Process exit status.
 */
async function main() {
  const registry = loadRegistry();
  const urls = new Set();
  const walk = (node) => {
    if (isRemote(node)) {
      urls.add(node);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === 'object') Object.values(node).forEach(walk);
  };
  walk(registry);

  const sorted = [...urls].sort();
  const cached = existsSync(SIZE_CACHE) ? JSON.parse(readFileSync(SIZE_CACHE, 'utf8')) : {};
  console.log(`[sizes] measuring ${sorted.length} files`);
  const sizes = await measure(sorted, cached);
  mkdirSync(dirname(SIZE_CACHE), { recursive: true });
  writeFileSync(SIZE_CACHE, `${JSON.stringify(sizes, null, 1)}\n`);
  console.log(`[sizes] wrote ${SIZE_CACHE}`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(`[sizes] ${error.message}`);
    process.exit(2);
  }
);
