#!/usr/bin/env node
/**
 * Generates `src/variants.generated.ts` from the model registry.
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
 * `DEFAULT` keys are skipped. They are aliases that `variants()` resolves per
 * platform at import time, so benchmarking one would measure whichever concrete
 * variant it happens to point at — under a second name, at a second cost.
 *
 * Usage:
 *   node scripts/generate-variants.mjs            # sizes from the cache
 *   node scripts/generate-variants.mjs --sizes    # re-measure over the network
 *   node scripts/generate-variants.mjs --check    # fail if the file is stale
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_SRC = resolve(APP_ROOT, '../../packages/react-native-executorch/src');
const OUTPUT = join(APP_ROOT, 'src/variants.generated.ts');
const SIZE_CACHE = join(APP_ROOT, 'scripts/variant-sizes.json');

/** Backends that only exist on one platform, so a variant can be gated by name. */
const PLATFORM_OF_BACKEND = {
  coreml: ['ios'],
  mlx: ['ios'],
  vulkan: ['android'],
  xnnpack: ['ios', 'android'],
};

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
 * Reads the backend and precision out of a variant key.
 *
 * The key is the contract: `variants()` itself resolves defaults by splitting
 * on the first underscore, so a key that does not start with a backend tag is
 * already broken for the library, not only for this generator.
 * @param key A variant key such as `XNNPACK_8DA4W`.
 * @returns The lowercased backend tag and precision, or nulls when the key does
 * not name a backend.
 */
function describeKey(key) {
  const [head, ...rest] = key.toLowerCase().split('_');
  if (!(head in PLATFORM_OF_BACKEND)) return { backend: null, precision: null };
  return { backend: head, precision: rest.join('_') || 'default' };
}

/**
 * Walks the registry and collects one entry per concrete variant.
 * @param registry The evaluated `models` object.
 * @returns Variant descriptors in registry declaration order.
 */
function collectVariants(registry) {
  const out = [];

  const walk = (node, path) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;

    for (const key of Object.keys(node)) {
      // A per-platform alias for a variant enumerated under its own name.
      if (key === 'DEFAULT') continue;

      const child = node[key];
      if (!child || typeof child !== 'object') continue;

      const { backend, precision } = describeKey(key);
      const files = remoteFiles(child);

      // A node keyed by a backend tag and holding remote files is a variant.
      // Anything else is a grouping level: a task, a model, a size, a language.
      if (backend && files.length > 0) {
        out.push({
          registryPath: [...path, key].join('.'),
          task: path[0],
          model: path.slice(1).join('.'),
          variant: key,
          backend,
          precision,
          platforms: PLATFORM_OF_BACKEND[backend],
          files,
        });
        continue;
      }

      walk(child, [...path, key]);
    }
  };

  for (const task of Object.keys(registry)) walk(registry[task], [task]);
  return out;
}

/**
 * Collapses variants that resolve to byte-identical file sets.
 *
 * The registry legitimately reaches one export from several paths — Whisper is
 * keyed by language and Kokoro by locale, but every language shares one `.pte`.
 * Benchmarking each path would spend three device-minutes to measure the same
 * program under a different name.
 * @param variants Every variant found, in declaration order.
 * @returns One entry per distinct file set, the first path winning, with the
 * rest recorded as aliases.
 */
function dedupe(variants) {
  const byFiles = new Map();
  for (const variant of variants) {
    const key = variant.files.join('|');
    const seen = byFiles.get(key);
    if (seen) {
      seen.aliases.push(variant.registryPath);
      continue;
    }
    byFiles.set(key, { ...variant, aliases: [] });
  }
  return [...byFiles.values()];
}

/**
 * A short, stable, filesystem-safe id: `task/model-variant`, kebab-cased.
 *
 * Word boundaries are preserved through the camelCase split rather than
 * flattened, so the task reads as `image-embeddings` and not
 * `imageembeddings`: these ids are what a person passes to `--only` and reads
 * off a results table, and an unsplit run of letters is neither.
 * @param variant The variant to name.
 * @returns Its case id.
 */
function caseId(variant) {
  const slug = (value) =>
    value
      // camelCase and PascalCase boundaries become hyphens before lowercasing,
      // which is the only point at which the boundary is still visible.
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/[._]/g, '-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  return `${slug(variant.task)}/${slug(variant.model)}-${slug(variant.variant)}`;
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

/**
 * Renders the generated module.
 * @param variants The deduplicated variant list.
 * @returns TypeScript source, ready to write.
 */
function render(variants) {
  // Single quotes and spaced arrays, so the generated file satisfies the same
  // Prettier config as everything else and does not need a lint exemption.
  const q = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const qList = (values) => `[${values.map(q).join(', ')}]`;

  const rows = variants
    .map((variant) =>
      [
        '  {',
        `    id: ${q(variant.id)},`,
        `    task: ${q(variant.task)},`,
        `    model: ${q(variant.model)},`,
        `    variant: ${q(variant.variant)},`,
        `    registryPath: ${q(variant.registryPath)},`,
        `    backend: ${q(variant.backend)},`,
        `    precision: ${q(variant.precision)},`,
        `    platforms: ${qList(variant.platforms)},`,
        `    bytes: ${variant.bytes},`,
        `    aliases: ${qList(variant.aliases)},`,
        '  },',
      ].join('\n')
    )
    .join('\n');

  return `/**
 * Every concrete model variant the registry publishes.
 *
 * GENERATED by \`scripts/generate-variants.mjs\` from
 * \`packages/react-native-executorch/src/models.ts\`. Do not edit by hand:
 * regenerate instead, so the suite cannot drift from what the library ships.
 *
 * \`DEFAULT\` aliases are excluded — each resolves to a concrete variant that is
 * already listed under its own name. Variants sharing a byte-identical file set
 * are collapsed to one entry, with the other registry paths kept in
 * \`aliases\`: Whisper is keyed by language and Kokoro by locale, but each
 * shares a single \`.pte\` across every key.
 */

/** One benchmarkable model variant. */
export interface RegistryVariant {
  /** Stable case id, \`task/model-variant\`. */
  readonly id: string;
  /** Registry category, e.g. \`objectDetection\`. */
  readonly task: string;
  /** Dotted model path within the task, e.g. \`YOLO26.NANO.SIZE_384\`. */
  readonly model: string;
  /** Variant key, e.g. \`XNNPACK_FP32\`. */
  readonly variant: string;
  /** Full dotted path into \`models\`, e.g. \`objectDetection.RFDETR_NANO.XNNPACK_FP32\`. */
  readonly registryPath: string;
  readonly backend: 'xnnpack' | 'coreml' | 'mlx' | 'vulkan';
  /** Precision token from the variant key, e.g. \`fp32\`, \`8da4w\`. */
  readonly precision: string;
  /** Platforms whose binary can link this variant's backend. */
  readonly platforms: readonly ('ios' | 'android')[];
  /** Total download size in bytes. 0 when it could not be measured. */
  readonly bytes: number;
  /** Other registry paths resolving to the same files. */
  readonly aliases: readonly string[];
}

export const REGISTRY_VARIANTS: readonly RegistryVariant[] = [
${rows}
];
`;
}

async function main() {
  const argv = process.argv.slice(2);
  const refreshSizes = argv.includes('--sizes');
  const check = argv.includes('--check');

  const registry = loadRegistry();
  const variants = dedupe(collectVariants(registry));

  const cached = existsSync(SIZE_CACHE) ? JSON.parse(readFileSync(SIZE_CACHE, 'utf8')) : {};
  const urls = [...new Set(variants.flatMap((variant) => variant.files))];
  const sizes = refreshSizes ? await measure(urls, cached) : cached;
  if (refreshSizes) {
    mkdirSync(dirname(SIZE_CACHE), { recursive: true });
    writeFileSync(SIZE_CACHE, `${JSON.stringify(sizes, null, 1)}\n`);
  }

  const described = variants.map((variant) => ({
    ...variant,
    id: caseId(variant),
    bytes: variant.files.reduce((total, url) => total + (sizes[url] ?? 0), 0),
  }));

  const rendered = render(described);
  if (check) {
    const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, 'utf8') : '';
    if (current !== rendered) {
      console.error(
        '[variants] src/variants.generated.ts is stale — run `yarn bench:variants --sizes`'
      );
      process.exit(1);
    }
    console.log(`[variants] up to date (${described.length} variants)`);
    return;
  }

  writeFileSync(OUTPUT, rendered);
  const unmeasured = described.filter((variant) => variant.bytes === 0).length;
  const byPlatform = (platform) =>
    described.filter((variant) => variant.platforms.includes(platform));
  const gb = (list) => (list.reduce((n, v) => n + v.bytes, 0) / 1e9).toFixed(1);
  console.log(`[variants] wrote ${described.length} variants to ${OUTPUT}`);
  console.log(
    `[variants] android ${byPlatform('android').length} (${gb(byPlatform('android'))} GB) · ` +
      `ios ${byPlatform('ios').length} (${gb(byPlatform('ios'))} GB)`
  );
  if (unmeasured > 0) {
    console.log(`[variants] ${unmeasured} variants have no size — run with --sizes`);
  }
}

main().catch((error) => {
  console.error(`[variants] ${error.message}`);
  process.exit(2);
});
