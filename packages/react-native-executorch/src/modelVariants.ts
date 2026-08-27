/**
 * Platform-aware resolution of the `DEFAULT` alias in the {@link models}
 * registry.
 *
 * Every model in the registry that ships more than one export lists its
 * variants under backend-tagged keys (`XNNPACK_INT8`, `COREML_FP16`, ...) and
 * exposes a `DEFAULT` alias next to them. Pinning that alias to one fixed
 * variant means most users silently run the universal XNNPACK build on
 * hardware that has a much faster accelerator sitting idle — Core ML on iOS in
 * particular. `DEFAULT` is therefore resolved here, once at import time, from:
 *
 * 1. the platform the app is running on,
 * 2. the backends actually linked into the binary — the install-time
 *    `react-native-executorch` block in the app's `package.json` decides these,
 *    and every backend is on unless the app opts out,
 * 3. the order the variants are declared in, which breaks ties within a
 *    backend (`XNNPACK_INT8` before `XNNPACK_FP32` means "int8 unless told
 *    otherwise").
 *
 * A model whose best variant does not follow from that ordering can pin one
 * per platform — see the second argument of {@link variants}.
 *
 * Backends the resolver never picks on its own — MLX on iOS, Vulkan on
 * Android — stay reachable through their explicit keys. They win on some
 * models and lose on others, so they are an opt-in rather than a default.
 * @module ModelVariants
 * @internal
 */

import { Platform } from 'react-native';

import { rnexecutorchJsi } from './native/bridge';

/** The backend prefix a variant key starts with. */
type BackendTag = 'XNNPACK' | 'COREML' | 'MLX' | 'VULKAN';

/** The platforms the registry resolves defaults for. */
type TargetPlatform = 'ios' | 'android';

/**
 * Backends to try, best first, per platform.
 *
 * Core ML leads on iOS: it reaches the Neural Engine, which beats XNNPACK's
 * CPU kernels on every model family that ships both. XNNPACK leads on Android
 * and backs iOS up, because it is the one backend every model exports to.
 */
const BACKEND_ORDER: Record<TargetPlatform, readonly BackendTag[]> = {
  ios: ['COREML', 'XNNPACK'],
  android: ['XNNPACK'],
};

/** Variant keys pinned per platform, overriding {@link BACKEND_ORDER}. */
type PinnedVariants<V> = Partial<Record<TargetPlatform, Extract<keyof V, string>>>;

const ALL_TAGS: readonly BackendTag[] = ['XNNPACK', 'COREML', 'MLX', 'VULKAN'];

/**
 * Narrows `Platform.OS` to the platforms the registry distinguishes.
 * @returns The platform to resolve defaults for.
 */
function currentPlatform(): TargetPlatform {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

/**
 * Backends that are linked into this binary and usable on this device.
 * @returns The usable backend tags — every one of them when the native runtime
 * cannot be asked, so that a missing answer widens the choice rather than
 * narrowing it to nothing.
 */
function usableBackends(): ReadonlySet<BackendTag> {
  let registered: readonly string[] = [];
  try {
    registered = rnexecutorchJsi.getExecuTorchRegisteredBackends();
  } catch {
    registered = [];
  }
  if (registered.length === 0) return new Set(ALL_TAGS);

  const names = registered.map((name) => name.toLowerCase());
  const usable = ALL_TAGS.filter((tag) => names.some((name) => name.startsWith(tag.toLowerCase())));

  // The simulator links the Core ML backend but cannot run it: it has no
  // Neural Engine, and MPSGraph refuses the compiled models outright. MLX only
  // ever ships a device slice, so it drops out of `registered` on its own.
  if (currentPlatform() === 'ios' && rnexecutorchJsi.isEmulator === true) {
    return new Set(usable.filter((tag) => tag !== 'COREML' && tag !== 'MLX'));
  }
  return new Set(usable);
}

const PLATFORM = currentPlatform();
const USABLE = usableBackends();

/**
 * Reads the backend out of a variant key.
 * @param key The variant key, e.g. `COREML_FP16`.
 * @returns The backend the key names, or `undefined` when it names none.
 */
function backendOf(key: string): BackendTag | undefined {
  return ALL_TAGS.find((tag) => key === tag || key.startsWith(`${tag}_`));
}

/**
 * Picks the variant key this platform should default to.
 * @param keys The group's variant keys, in declaration order.
 * @param pinned Per-platform overrides.
 * @returns The chosen key.
 */
function pickVariant(
  keys: readonly string[],
  pinned?: PinnedVariants<Record<string, unknown>>
): string {
  const pin = pinned?.[PLATFORM];
  const pinnedBackend = pin === undefined ? undefined : backendOf(pin);
  if (pin !== undefined && keys.includes(pin) && pinnedBackend && USABLE.has(pinnedBackend)) {
    return pin;
  }

  for (const tag of BACKEND_ORDER[PLATFORM]) {
    if (!USABLE.has(tag)) continue;
    const match = keys.find((key) => backendOf(key) === tag);
    if (match !== undefined) return match;
  }

  // No preferred backend is both published for this model and linked into the
  // build — an app that opted out of the backends its models need. Hand back
  // the first variant so the registry still names a model and the failure
  // surfaces at load, where the error says which backend is missing.
  return keys[0]!;
}

/**
 * Adds a platform-resolved `DEFAULT` to a group of backend variants.
 *
 * Declare the variants best-first within each backend: with several exports
 * from the same backend, the earliest one wins.
 * @typeParam V The variant map.
 * @param map The group's variants, keyed by backend and precision.
 * @param pinned Variant keys to prefer on a given platform, for models whose
 * best export does not follow from the declaration order. Ignored when the
 * pinned variant's backend is not linked into the build.
 * @returns The variants, plus the `DEFAULT` alias for this platform.
 */
export function variants<V extends Record<string, object>>(
  map: V,
  pinned?: PinnedVariants<V>
): V & { readonly DEFAULT: V[keyof V] } {
  const key = pickVariant(Object.keys(map), pinned);
  return { ...map, DEFAULT: map[key] as V[keyof V] };
}

/**
 * Adds a `DEFAULT` to a group of sub-groups — a model family split by scale or
 * input size — mirroring the `DEFAULT` of the first sub-group declared.
 *
 * The sub-group resolved its own default per platform, so the family inherits
 * that without repeating the rules.
 * @typeParam V The sub-group map.
 * @param map The family's sub-groups, most representative first.
 * @returns The sub-groups, plus the inherited `DEFAULT`.
 */
export function family<V extends Record<string, { readonly DEFAULT: unknown }>>(
  map: V
): V & { readonly DEFAULT: V[keyof V]['DEFAULT'] } {
  const first = Object.keys(map)[0]!;
  return { ...map, DEFAULT: map[first]!.DEFAULT as V[keyof V]['DEFAULT'] };
}
