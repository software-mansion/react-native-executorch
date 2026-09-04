/**
 * Every benchmarkable variant, derived from the registry at runtime.
 *
 * The registry is a plain nested object once imported, and `variants()` only
 * spreads a map and adds a `DEFAULT`, so the variant list is a walk rather than
 * something that has to be generated. This used to be a 3,000-line checked-in
 * file produced by a script; the only thing that walk cannot recover is the
 * download size, which needs a network round trip, so that alone stays cached
 * on disk in `scripts/variant-sizes.json`.
 *
 * A missing size is not an error. It costs the size cap for that variant and
 * leaves a blank column, which is better than refusing to measure a model
 * somebody just added to the registry.
 */

import { models } from 'react-native-executorch';

import SIZES from '../scripts/variant-sizes.json';

/** Backends that exist on one platform only, so a variant is gated by its name. */
const PLATFORM_OF_BACKEND: Record<string, readonly ('ios' | 'android')[]> = {
  coreml: ['ios'],
  mlx: ['ios'],
  vulkan: ['android'],
  xnnpack: ['ios', 'android'],
};

/** One measurable variant. */
export interface RegistryVariant {
  /** Stable, filesystem-safe id: `task/model-variant`. What `--only` takes. */
  readonly id: string;
  readonly task: string;
  readonly model: string;
  readonly variant: string;
  /** Dotted path into `models`, e.g. `classification.EFFICIENTNET_V2_S.XNNPACK_INT8`. */
  readonly registryPath: string;
  readonly backend: string;
  readonly precision: string;
  readonly platforms: readonly ('ios' | 'android')[];
  /** Total download in bytes, or 0 when no size is cached. */
  readonly bytes: number;
  /** Other registry paths that resolve to the same files. */
  readonly aliases: readonly string[];
}

const sizes = SIZES as Record<string, number>;

const isRemote = (value: unknown): value is string =>
  typeof value === 'string' && /^https?:\/\//.test(value);

/** Every remote URL reachable from a variant node, deduped and ordered. */
function remoteFiles(node: unknown): string[] {
  const found: string[] = [];
  const walk = (value: unknown): void => {
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

/** Splits a variant key such as `XNNPACK_INT8` into its backend and precision. */
function describeKey(key: string): { backend: string | null; precision: string | null } {
  const [head, ...rest] = key.toLowerCase().split('_');
  if (!head || !(head in PLATFORM_OF_BACKEND)) return { backend: null, precision: null };
  return { backend: head, precision: rest.join('_') || 'default' };
}

/**
 * A short, stable id: `task/model-variant`, kebab-cased.
 *
 * The camelCase boundary becomes a hyphen before lowercasing, so a task reads
 * as `image-embeddings` rather than `imageembeddings`. These ids are what a
 * person passes to `--only` and reads off a results table.
 * @param task The registry task.
 * @param model The dotted model path below the task.
 * @param variant The variant key.
 * @returns The case id.
 */
function caseId(task: string, model: string, variant: string): string {
  const slug = (value: string) =>
    value
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/[._]/g, '-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  return `${slug(task)}/${slug(model)}-${slug(variant)}`;
}

/**
 * Walks the registry and returns one entry per distinct set of files.
 *
 * `DEFAULT` keys are skipped: they are per-platform aliases that `variants()`
 * resolves at import time, so benchmarking one would measure whichever concrete
 * variant it points at, under a second name and at a second cost.
 *
 * Variants that resolve to byte-identical file sets are collapsed, because the
 * registry legitimately reaches one export from several paths — Whisper is
 * keyed by language and Kokoro by locale, and every language shares one `.pte`.
 * The first path wins and the rest are recorded as aliases.
 * @returns The variant list, in declaration order.
 */
function collect(): RegistryVariant[] {
  const byFiles = new Map<string, { variant: RegistryVariant; aliases: string[] }>();

  const walk = (node: unknown, path: string[]): void => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;

    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      if (key === 'DEFAULT') continue;
      if (!child || typeof child !== 'object') continue;

      const { backend, precision } = describeKey(key);
      const files = remoteFiles(child);

      // A node keyed by a backend tag and holding remote files is a variant.
      // Anything else is a grouping level: a task, a model, a size, a language.
      if (backend && precision && files.length > 0) {
        const registryPath = [...path, key].join('.');
        const fileKey = files.join('|');
        const seen = byFiles.get(fileKey);
        if (seen) {
          seen.aliases.push(registryPath);
          continue;
        }
        const task = path[0]!;
        const model = path.slice(1).join('.');
        byFiles.set(fileKey, {
          aliases: [],
          variant: {
            id: caseId(task, model, key),
            task,
            model,
            variant: key,
            registryPath,
            backend,
            precision,
            platforms: PLATFORM_OF_BACKEND[backend]!,
            bytes: files.reduce((sum, file) => sum + (sizes[file] ?? 0), 0),
            aliases: [],
          },
        });
        continue;
      }

      walk(child, [...path, key]);
    }
  };

  for (const [task, node] of Object.entries(models)) walk(node, [task]);

  return [...byFiles.values()].map(({ variant, aliases }) => ({ ...variant, aliases }));
}

/** Every distinct variant the registry publishes. */
export const REGISTRY_VARIANTS: readonly RegistryVariant[] = collect();
