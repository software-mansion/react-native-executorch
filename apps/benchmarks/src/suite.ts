/**
 * Case selection.
 *
 * A case is a generated registry variant joined to its task driver. Nothing is
 * declared per model here: the variant list comes from `models.ts` by way of
 * `src/registry.ts`, and the driver comes from `src/drivers.ts`,
 * so a variant added to the library is benchmarked without touching this file
 * and a variant removed from it stops being benchmarked the same way.
 *
 * Selection applies four filters, in this order:
 *
 * 1. **Platform.** A Core ML or MLX variant cannot run on Android and a Vulkan
 *    one cannot run on iOS. These are excluded rather than reported as failures.
 * 2. **Driver.** A task with no driver is reported as `skipped`, not dropped —
 *    a registry category nobody wired up should be visible, not invisible.
 * 3. **Size.** A variant whose download exceeds the cap is reported as
 *    `skipped` with its size, so a run on a 6 GB phone says what it did not
 *    attempt instead of dying partway through a 8 GB download.
 * 4. **Tier or explicit ids.**
 */

import { Platform } from 'react-native';

import type { SuiteName } from './config';
import { driverFor, type Driver } from './drivers';
import { REGISTRY_VARIANTS, type RegistryVariant } from './registry';

/** A variant paired with the driver that runs it. */
export interface BenchCase {
  readonly id: string;
  readonly variant: RegistryVariant;
  readonly driver: Driver;
}

/** A variant that will not run, and why. */
export interface SkippedCase {
  readonly id: string;
  readonly variant: RegistryVariant;
  readonly reason: string;
}

export interface Selection {
  readonly cases: readonly BenchCase[];
  readonly skipped: readonly SkippedCase[];
}

/**
 * Tasks in the `quick` tier: the small models, for bisecting a regression
 * without waiting on hundreds of gigabytes of weights.
 */
const QUICK_TASKS = new Set([
  'classification',
  'styleTransfer',
  'semanticSegmentation',
  'keypointDetection',
  'textEmbeddings',
  'voiceActivityDetection',
  'ocr',
]);

/**
 * Tasks excluded from `full`, which is otherwise everything.
 *
 * LLMs are their own tier because they dominate the estate: 39 of the Android
 * variants, and around 90 GB of the 118 GB. A `full` run that pulled them in
 * would be a multi-day download before a single vision model was measured.
 */
const LLM_TASKS = new Set(['llm']);

const currentPlatform = (): 'ios' | 'android' => (Platform.OS === 'ios' ? 'ios' : 'android');

/**
 * Resolves the registry config for a variant by walking its dotted path.
 *
 * The generated list stores the path rather than the config object because the
 * generated module is produced outside the app, where the registry's own
 * objects are not available to embed. Resolving here also means the app always
 * benchmarks the config the shipped library holds, not a copy of it taken when
 * the list was generated.
 * @param registry The `models` export.
 * @param path A dotted path such as `objectDetection.RFDETR_NANO.XNNPACK_FP32`.
 * @returns The config, or undefined when the path no longer exists.
 */
export function resolveConfig(registry: unknown, path: string): any {
  let node: any = registry;
  for (const segment of path.split('.')) {
    if (node === null || node === undefined) return undefined;
    node = node[segment];
  }
  return node;
}

export interface SelectOptions {
  readonly suite: SuiteName;
  readonly only: readonly string[];
  /** Largest total download a case may have, in bytes. 0 disables the cap. */
  readonly maxBytes: number;
  /** Task names to include. Empty means "whatever the tier says". */
  readonly tasks: readonly string[];
  /** Backend tags to include. Empty means every backend this platform runs. */
  readonly backends: readonly string[];
}

/**
 * Selects the cases to run and the variants deliberately left out.
 * @param options The run's filters.
 * @returns The runnable cases in registry order, plus the skipped variants.
 */
export function selectCases(options: SelectOptions): Selection {
  const platform = currentPlatform();
  const cases: BenchCase[] = [];
  const skipped: SkippedCase[] = [];

  for (const variant of REGISTRY_VARIANTS) {
    // Not a failure and not a skip: this platform's binary cannot link the
    // backend, so the variant is not part of this device's estate at all.
    if (!variant.platforms.includes(platform)) continue;
    if (options.backends.length > 0 && !options.backends.includes(variant.backend)) continue;

    if (options.only.length > 0) {
      if (!options.only.includes(variant.id)) continue;
    } else {
      if (options.tasks.length > 0) {
        if (!options.tasks.includes(variant.task)) continue;
      } else if (options.suite === 'quick') {
        if (!QUICK_TASKS.has(variant.task)) continue;
      } else if (options.suite === 'full') {
        if (LLM_TASKS.has(variant.task)) continue;
      }
      // `everything` applies no tier filter.
    }

    const driver = driverFor(variant);
    if (!driver) {
      skipped.push({ id: variant.id, variant, reason: `no driver for task ${variant.task}` });
      continue;
    }
    if (options.maxBytes > 0 && variant.bytes > options.maxBytes) {
      skipped.push({
        id: variant.id,
        variant,
        reason:
          `download is ${(variant.bytes / 1e9).toFixed(2)} GB, over the ` +
          `${(options.maxBytes / 1e9).toFixed(2)} GB cap`,
      });
      continue;
    }

    cases.push({ id: variant.id, variant, driver });
  }

  return { cases, skipped };
}
