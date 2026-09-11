/**
 * How the `DEFAULT` alias in the `models` registry is chosen.
 *
 * The alias is resolved once, when the registry module is first imported, from
 * the platform and the backends the native binary was linked with. Every case
 * below therefore reloads the registry behind a `jest.resetModules()` rather
 * than reading the copy the test file imported.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

import { Platform } from 'react-native';

import { fakeJsi } from '../support/fakeJsi';

type Node = Record<string, unknown>;

const isObject = (value: unknown): value is Node =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isConfig = (value: unknown): value is Node =>
  isObject(value) &&
  (typeof value.modelPath === 'string' ||
    (isObject(value.modelPaths) &&
      Object.values(value.modelPaths).every((path) => typeof path === 'string')));

/** The `.pte` file(s) a config names, as one comparable string. */
const modelPathsOf = (config: Node): string =>
  typeof config.modelPath === 'string'
    ? config.modelPath
    : Object.values(config.modelPaths as Node)
        .map(String)
        .sort()
        .join('|');

const isUpperKey = (key: string) => /^[A-Z0-9_]+$/.test(key);

/** Every group that names a `DEFAULT`, with the dotted path it sits at. */
function variantGroups(node: unknown, path: string[] = []): { label: string; group: Node }[] {
  if (!isObject(node)) return [];
  const here = isConfig(node.DEFAULT) ? [{ label: path.join('.'), group: node }] : [];
  const nested = Object.entries(node)
    .filter(([key, value]) => key !== 'DEFAULT' && isObject(value))
    .flatMap(([key, value]) => variantGroups(value, [...path, key]));
  return [...here, ...nested];
}

/** The backend variants a group lists directly, by key. */
const namedVariants = (group: Node): [string, Node][] =>
  Object.entries(group).filter(
    ([key, value]) => key !== 'DEFAULT' && isUpperKey(key) && isConfig(value)
  ) as [string, Node][];

/** The variant key a group's `DEFAULT` points at, when it points at its own. */
const defaultKeyOf = (group: Node): string | undefined =>
  namedVariants(group).find(
    ([, value]) => modelPathsOf(value) === modelPathsOf(group.DEFAULT as Node)
  )?.[0];

const originalOs = Platform.OS;

/**
 * Points `Platform.OS` at a target, on the module instance the next `require`
 * will resolve to. Has to run after `jest.resetModules()`, which hands out a
 * fresh `react-native` module.
 * @param os The platform to pretend to run on.
 */
function setPlatform(os: 'ios' | 'android'): void {
  (require('react-native').Platform as { OS: string }).OS = os;
}

/**
 * Reloads the registry as it would resolve on a given device.
 * @param options The platform, the linked backends, and whether the device is
 * a simulator.
 * @returns The freshly resolved `models` registry.
 */
function registryFor(options: {
  os: 'ios' | 'android';
  backends?: string[];
  isEmulator?: boolean;
}): Node {
  fakeJsi.setRegisteredBackends(
    options.backends ?? ['XnnpackBackend', 'CoreMLBackend', 'MLXBackend', 'VulkanBackend']
  );
  fakeJsi.setIsEmulator(options.isEmulator ?? false);

  jest.resetModules();
  setPlatform(options.os);
  return require('../../src/models').models as Node;
}

/**
 * Every `variants(...)` call in the registry source, with the variant keys it
 * lists and whether it pins one for iOS.
 *
 * Prettier gives the two call shapes distinct first lines — `variants({` when
 * the group takes no pins, `variants(` when it does — which is what this reads.
 * @returns One entry per call, in source order.
 */
function variantsCalls(): { name: string; keys: string[]; pinsIos: boolean }[] {
  const source = readFileSync(join(__dirname, '../../src/models.ts'), 'utf8').split('\n');
  const calls: { name: string; keys: string[]; pinsIos: boolean }[] = [];

  for (let line = 0; line < source.length; line++) {
    const opened = source[line]!.match(/^(\s*)([A-Z][A-Z0-9_]*): variants\((\{?)$/);
    if (!opened) continue;
    const [, indent, name, inlineBrace] = opened;

    const closer = inlineBrace ? `${indent}}),` : `${indent}),`;
    let end = line + 1;
    while (end < source.length && source[end] !== closer) end++;

    const body = source.slice(line + 1, end);
    const keys = body.flatMap((entry) => entry.match(/^\s*([A-Z][A-Z0-9_]*):/)?.slice(1) ?? []);
    calls.push({ name: name!, keys, pinsIos: body.some((entry) => /\bios:/.test(entry)) });
    line = end;
  }

  return calls;
}

/** Every group of the reloaded registry, paired with the key it defaulted to. */
const defaultsOf = (registry: Node) =>
  variantGroups(registry).map(({ label, group }) => ({
    label,
    key: defaultKeyOf(group),
    path: modelPathsOf(group.DEFAULT as Node),
    offers: namedVariants(group).map(([key]) => key),
  }));

afterEach(() => {
  jest.resetModules();
  setPlatform(originalOs as 'ios' | 'android');
});

describe('DEFAULT variant resolution', () => {
  it('finds groups to check', () => {
    expect(defaultsOf(registryFor({ os: 'ios' })).length).toBeGreaterThan(100);
  });

  it('defaults to Core ML on iOS wherever a Core ML export exists and nothing is pinned', () => {
    // Core ML leads the iOS order, so it wins by default. It does not always
    // win on the device: distiluse pins MLX because MLX measured faster there.
    // A group that names an explicit iOS pin has been measured, so it is
    // exempt; the pin itself is guarded by `pins one` below.
    const pinned = new Set(
      variantsCalls()
        .filter(({ pinsIos }) => pinsIos)
        .map(({ name }) => name)
    );
    const offenders = defaultsOf(registryFor({ os: 'ios' }))
      .filter(({ label }) => !pinned.has(label.split('.').pop()!))
      .filter(({ offers }) => offers.some((key) => key.startsWith('COREML')))
      .filter(({ key }) => key !== undefined && !key.startsWith('COREML'))
      .map(({ label, key }) => `${label}: ${key}`);

    expect(offenders).toEqual([]);
  });

  it('never defaults to an iOS-only backend on Android', () => {
    const offenders = defaultsOf(registryFor({ os: 'android' }))
      .filter(({ path }) => /\/(coreml|mlx)\//.test(path))
      .map(({ label, path }) => `${label}: ${path}`);

    expect(offenders).toEqual([]);
  });

  it('defaults to XNNPACK on Android where no Vulkan export exists', () => {
    const offenders = defaultsOf(registryFor({ os: 'android' }))
      .filter(({ offers }) => offers.some((key) => key.startsWith('XNNPACK')))
      .filter(({ offers }) => !offers.some((key) => key.startsWith('VULKAN')))
      .filter(({ key }) => key !== undefined && !key.startsWith('XNNPACK'))
      .map(({ label, key }) => `${label}: ${key}`);

    expect(offenders).toEqual([]);
  });

  it('prefers MLX over XNNPACK on iOS where no Core ML export exists', () => {
    const offenders = defaultsOf(registryFor({ os: 'ios' }))
      .filter(({ offers }) => offers.some((key) => key.startsWith('MLX')))
      .filter(({ offers }) => !offers.some((key) => key.startsWith('COREML')))
      .filter(({ key }) => key !== undefined && !key.startsWith('MLX'))
      .map(({ label, key }) => `${label}: ${key}`);

    expect(offenders).toEqual([]);
  });

  it('prefers Vulkan over XNNPACK on Android wherever a Vulkan export exists', () => {
    const offenders = defaultsOf(registryFor({ os: 'android' }))
      .filter(({ offers }) => offers.some((key) => key.startsWith('VULKAN')))
      .filter(({ key }) => key !== undefined && !key.startsWith('VULKAN'))
      .map(({ label, key }) => `${label}: ${key}`);

    expect(offenders).toEqual([]);
  });

  it('never picks Vulkan on iOS or an iOS-only backend on Android', () => {
    expect(
      defaultsOf(registryFor({ os: 'ios' }))
        .filter(({ key }) => key?.startsWith('VULKAN'))
        .map(({ label, key }) => `${label}: ${key}`)
    ).toEqual([]);

    expect(
      defaultsOf(registryFor({ os: 'android' }))
        .filter(({ key }) => key?.startsWith('COREML') || key?.startsWith('MLX'))
        .map(({ label, key }) => `${label}: ${key}`)
    ).toEqual([]);
  });

  it('reads every variant group out of the registry source', () => {
    // The pin case below is a source-level check, so it passes for free if the
    // scanner stops matching the shape Prettier writes.
    const calls = variantsCalls();
    expect(calls.length).toBeGreaterThan(100);
    expect(calls.filter(({ pinsIos }) => pinsIos).length).toBeGreaterThan(0);
    expect(calls.filter(({ keys }) => keys.length === 0)).toEqual([]);
  });

  it('every group offering both Core ML and MLX pins one', () => {
    // Core ML sits above MLX in the backend order only to make the resolution
    // deterministic, and that ordering is not a benchmark result. Where a model
    // publishes both, the winner has to be written down at the call site so the
    // choice is reviewable rather than an accident of the enum order.
    //
    // A pin to the backend the order would have picked anyway is invisible at
    // runtime, so this reads the registry source rather than the resolved
    // registry.
    const offenders = variantsCalls()
      .filter(({ keys }) => keys.some((key) => key.startsWith('COREML')))
      .filter(({ keys }) => keys.some((key) => key.startsWith('MLX')))
      .filter(({ pinsIos }) => !pinsIos)
      .map(({ name, keys }) => `${name}: ${keys.join(', ')}`);

    expect(offenders).toEqual([]);
  });

  it('falls back to XNNPACK on the iOS simulator, which runs neither Core ML nor MLX', () => {
    const offenders = defaultsOf(registryFor({ os: 'ios', isEmulator: true }))
      .filter(({ path }) => /\/(coreml|mlx)\//.test(path))
      .map(({ label, path }) => `${label}: ${path}`);

    expect(offenders).toEqual([]);
  });

  it('falls back to XNNPACK on iOS when the app links XNNPACK only', () => {
    const offenders = defaultsOf(registryFor({ os: 'ios', backends: ['XnnpackBackend'] }))
      .filter(({ key }) => key !== undefined && !key.startsWith('XNNPACK'))
      .map(({ label, key }) => `${label}: ${key}`);

    expect(offenders).toEqual([]);
  });

  it('picks a variant the group actually offers, on every device', () => {
    const devices = [
      { os: 'ios' as const },
      { os: 'ios' as const, isEmulator: true },
      { os: 'ios' as const, backends: ['XnnpackBackend'] },
      { os: 'android' as const },
      // An app that opted out of every backend its models were published for:
      // the registry still has to name a model rather than yield `undefined`.
      { os: 'android' as const, backends: ['CoreMLBackend'] },
    ];

    for (const device of devices) {
      const offenders = variantGroups(registryFor(device))
        .filter(({ group }) => namedVariants(group).length > 0)
        .filter(({ group }) => defaultKeyOf(group) === undefined)
        .map(({ label }) => `${JSON.stringify(device)} ${label}`);

      expect(offenders).toEqual([]);
    }
  });

  it('keeps the same model files reachable through named variants on both platforms', () => {
    // Only the default moves per platform; the catalogue itself must not.
    const keysOf = (registry: Node) =>
      defaultsOf(registry)
        .map(({ label, offers }) => `${label}: ${offers.join(',')}`)
        .sort();

    expect(keysOf(registryFor({ os: 'ios' }))).toEqual(keysOf(registryFor({ os: 'android' })));
  });

  it('resolves a family to the default of its first sub-group', () => {
    const registry = registryFor({ os: 'ios' });
    const objectDetection = registry.objectDetection as Node;
    const yolo = objectDetection.YOLO26 as Node;
    const nano = yolo.NANO as Node;

    expect(yolo.DEFAULT).toBe(nano.DEFAULT);
    expect(nano.DEFAULT).toBe((nano.SIZE_384 as Node).DEFAULT);
  });
});

describe('variant selection rules', () => {
  /** The distiluse group, the one place a pin overrides the backend order. */
  const distiluse = (registry: Node): Node =>
    (registry.textEmbeddings as Node).DISTILUSE_BASE_MULTILINGUAL_CASED_V2 as Node;

  it('breaks a tie within one backend by declaration order', () => {
    // With XNNPACK the only linked backend, every group has to land on the
    // first XNNPACK variant it declares, whatever else it publishes.
    const offenders = defaultsOf(registryFor({ os: 'ios', backends: ['XnnpackBackend'] }))
      .filter(({ offers }) => offers.some((key) => key.startsWith('XNNPACK')))
      .filter(({ key, offers }) => key !== offers.find((entry) => entry.startsWith('XNNPACK')))
      .map(({ label, key, offers }) => `${label}: ${key} of ${offers.join(', ')}`);

    expect(offenders).toEqual([]);
  });

  it('honours a pinned variant over the backend order', () => {
    // Core ML leads the iOS order, so MLX here is the pin and nothing else.
    expect(defaultKeyOf(distiluse(registryFor({ os: 'ios' })))).toBe('MLX_INT8');
  });

  it('ignores a pin whose backend the app did not link in', () => {
    const registry = registryFor({ os: 'ios', backends: ['XnnpackBackend'] });
    expect(defaultKeyOf(distiluse(registry))).toBe('XNNPACK_8DA4W');
  });

  it('applies a pin only on the platform it names', () => {
    // The same group pins MLX for iOS only; Android resolves by its own order.
    expect(defaultKeyOf(distiluse(registryFor({ os: 'android' })))).toBe('VULKAN_FP16');
  });
});

describe('feature map', () => {
  // `models.<task>.<MODEL>.DEFAULT` only reaches the accelerated export when
  // the app downloaded that backend, and `features` is the documented way to
  // say which backends an app needs. A family whose feature entry is missing a
  // backend it publishes therefore falls back to XNNPACK forever, quietly.
  //
  // Categories map to feature names one-to-one except where noted; a category
  // added without an entry here fails the coverage case below.
  const FEATURE_OF_CATEGORY: Record<string, string> = {
    classification: 'classification',
    styleTransfer: 'styleTransfer',
    semanticSegmentation: 'semanticSegmentation',
    objectDetection: 'objectDetection',
    keypointDetection: 'keypointDetection',
    instanceSegmentation: 'instanceSegmentation',
    voiceActivityDetection: 'vad',
    speechToText: 'speechToText',
    tokenizer: 'tokenizer',
    llm: 'llm',
    textEmbeddings: 'textEmbeddings',
    privacyFilter: 'privacyFilter',
    imageEmbeddings: 'imageEmbeddings',
    textToImage: 'textToImage',
    textToSpeech: 'textToSpeech',
    ocr: 'ocr',
  };

  const { FEATURE_MAP } = require('../../scripts/download-libs.js');

  /** Every backend folder the URLs under a registry category point into. */
  function publishedBackends(node: unknown): Set<string> {
    const found = new Set<string>();
    const walk = (value: unknown): void => {
      if (typeof value === 'string') {
        const match = value.match(/\/(xnnpack|coreml|mlx|vulkan)\//);
        if (match) found.add(match[1]!);
      } else if (Array.isArray(value)) value.forEach(walk);
      else if (isObject(value)) Object.values(value).forEach(walk);
    };
    walk(node);
    return found;
  }

  const registry = registryFor({ os: 'ios' });

  it('names a feature for every registry category', () => {
    expect(Object.keys(registry).filter((category) => !FEATURE_OF_CATEGORY[category])).toEqual([]);
  });

  it('provisions every backend the registry publishes for that feature', () => {
    const offenders: string[] = [];

    for (const [category, node] of Object.entries(registry)) {
      const feature = FEATURE_OF_CATEGORY[category]!;
      // Multimodal LLMs are split into their own feature; both entries cover
      // the `llm` category, so the union of the two is what an LLM app gets.
      const provisioned = new Set<string>([
        ...FEATURE_MAP[feature].backends,
        ...(feature === 'llm' ? FEATURE_MAP.multimodalLLM.backends : []),
      ]);

      for (const backend of publishedBackends(node)) {
        if (!provisioned.has(backend)) offenders.push(`${feature} is missing ${backend}`);
      }
    }

    expect(offenders.sort()).toEqual([]);
  });
});
