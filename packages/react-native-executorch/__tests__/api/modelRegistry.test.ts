/**
 * Rules the `models` registry has to satisfy.
 *
 * The registry is the only thing standing between an app and a 404 at runtime:
 * a typo in a URL, a backend suffix that disagrees with the folder it lives in,
 * or a default alias that drifted from the variant it is supposed to mirror all
 * type-check cleanly and only fail on a device, after a download.
 *
 * The registry nests irregularly — a category holds entries, an entry may hold
 * size groups, and a size group holds backend variants — so everything here is
 * driven by a recursive walk rather than by an assumed depth.
 */
import { models } from '../../src/models';

const BASE_URL = 'https://huggingface.co/software-mansion/react-native-executorch';

type Node = Record<string, unknown>;

const isObject = (value: unknown): value is Node =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * A leaf that a `create<Task>` factory could be handed: it names a model file.
 */
const isConfig = (value: unknown): value is Node =>
  isObject(value) && typeof value.modelPath === 'string';

/**
 * A backend variant key, e.g. `XNNPACK_FP32`. Size keys (`TINY`) look the same.
 */
const isUpperKey = (key: string) => /^[A-Z0-9_]+$/.test(key);

/**
 * A node's own config fields, with any nested variant/size groups stripped.
 */
const configPart = (node: Node): Node =>
  Object.fromEntries(Object.entries(node).filter(([key]) => !isUpperKey(key)));

/**
 * Every `[path, url]` string leaf that looks like a URL.
 */
function urlLeaves(node: unknown, path: string[] = []): [string, string][] {
  if (typeof node === 'string') return /^https?:/i.test(node) ? [[path.join('.'), node]] : [];
  if (Array.isArray(node)) return node.flatMap((item, i) => urlLeaves(item, [...path, `${i}`]));
  if (isObject(node)) {
    return Object.entries(node).flatMap(([key, value]) => urlLeaves(value, [...path, key]));
  }
  return [];
}

/**
 * Every task config in the registry, with the dotted path it sits at.
 */
function configs(node: unknown, path: string[] = []): { label: string; config: Node }[] {
  if (!isObject(node)) return [];
  const here = isConfig(node) ? [{ label: path.join('.'), config: node }] : [];
  const nested = Object.entries(node)
    .filter(([, value]) => isObject(value))
    .flatMap(([key, value]) => configs(value, [...path, key]));
  return [...here, ...nested];
}

/**
 * Every group that both spreads a default config and lists named variants —
 * the `{ ...X_FP32, XNNPACK_FP32: X_FP32, COREML_FP16: X_FP16 }` shape.
 */
function variantGroups(node: unknown, path: string[] = []): { label: string; group: Node }[] {
  if (!isObject(node)) return [];
  const variants = Object.entries(node).filter(
    ([key, value]) => isUpperKey(key) && isConfig(value)
  );
  const here =
    variants.length > 0 && isConfig(node) ? [{ label: path.join('.'), group: node }] : [];
  const nested = Object.entries(node)
    .filter(([, value]) => isObject(value))
    .flatMap(([key, value]) => variantGroups(value, [...path, key]));
  return [...here, ...nested];
}

const urls = urlLeaves(models);
const allConfigs = configs(models);
const allGroups = variantGroups(models);

describe('models registry — URLs', () => {
  it('finds URLs in every category', () => {
    for (const category of Object.keys(models)) {
      expect(urls.filter(([path]) => path.startsWith(`${category}.`)).length).toBeGreaterThan(0);
    }
  });

  it.each(urls)('%s is served over https from the software-mansion org', (_path, url) => {
    expect(url.startsWith(`${BASE_URL}-`)).toBe(true);
  });

  it.each(urls)('%s pins an explicit revision', (_path, url) => {
    expect(url).toMatch(/\/resolve\/v\d+\.\d+\.\d+\//);
  });

  it.each(urls)('%s is free of whitespace and empty path segments', (_path, url) => {
    expect(url).not.toMatch(/\s/);
    expect(url.replace('https://', '')).not.toMatch(/\/\//);
  });

  it('names every .pte after the modelname_backend_precision contract', () => {
    const offenders = urls
      .filter(([, url]) => url.endsWith('.pte'))
      .filter(([, url]) => {
        const parts = url.split('/').pop()!.replace('.pte', '').split('_');
        const backend = parts.at(-2) ?? '';
        const precision = parts.at(-1) ?? '';
        return (
          !/^(xnnpack|coreml|mlx|qnn|vulkan)$/.test(backend) ||
          !/^(fp32|fp16|bf16|int8|int4|8da4w|4w|dynamic)$/.test(precision)
        );
      })
      .map(([path, url]) => `${path}: ${url.split('/').pop()}`);

    expect(offenders).toEqual([]);
  });

  it('stores every .pte in a folder matching its backend suffix', () => {
    const offenders = urls
      .filter(([, url]) => url.endsWith('.pte'))
      .filter(([, url]) => {
        const segments = url.split('/');
        return segments.at(-2) !== segments.at(-1)!.replace('.pte', '').split('_').at(-2);
      })
      .map(([path, url]) => `${path}: ${url}`);

    expect(offenders).toEqual([]);
  });

  it('points every tokenizer entry at a tokenizer.json', () => {
    const tokenizerUrls = urls.filter(([path]) => /tokenizerPath|^tokenizer\./.test(path));
    expect(tokenizerUrls.length).toBeGreaterThan(0);
    for (const [, url] of tokenizerUrls) expect(url.endsWith('tokenizer.json')).toBe(true);
  });
});

describe('models registry — structure', () => {
  it('exports the single models object and nothing else', async () => {
    const registry = await import('../../src/models');
    expect(Object.keys(registry)).toEqual(['models']);
  });

  it('reaches a task config in every category', () => {
    for (const category of Object.keys(models)) {
      const inCategory = allConfigs.filter(({ label }) => label.startsWith(`${category}.`));
      // `tokenizer` holds bare URL strings rather than configs.
      if (category === 'tokenizer') continue;
      expect(inCategory.length).toBeGreaterThan(0);
    }
  });

  it('finds variant groups to check', () => {
    expect(allGroups.length).toBeGreaterThan(10);
  });

  it.each(allGroups)('$label defaults to one of its own variants', ({ group }) => {
    // Compare config fields only: a variant may itself carry further nested
    // groups (a size family, say), which the spread default never includes.
    const variants = Object.entries(group)
      .filter(([key, value]) => isUpperKey(key) && isConfig(value))
      .map(([, value]) => JSON.stringify(configPart(value as Node)));
    const defaults = JSON.stringify(configPart(group));

    // The default is spread in alongside the variants, so it must be
    // structurally identical to one of them — otherwise `models.x.Y` and
    // `models.x.Y.XNNPACK_FP32` silently disagree.
    expect(variants).toContain(defaults);
  });

  it.each(allGroups)('$label gives every variant a distinct model path', ({ group }) => {
    const paths = Object.entries(group)
      .filter(([key, value]) => isUpperKey(key) && isConfig(value))
      .map(([, value]) => (value as Node).modelPath);

    expect(new Set(paths).size).toBe(paths.length);
  });

  it('uses distinct entry names within each category', () => {
    for (const group of Object.values(models)) {
      const names = Object.keys(group as Node);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});

describe('models registry — task configs', () => {
  const withLabels = allConfigs.filter(({ config }) =>
    Array.isArray((config.modelOpts as Node | undefined)?.labels)
  );

  it('finds label vocabularies to check', () => {
    expect(withLabels.length).toBeGreaterThan(0);
  });

  it.each(withLabels)('$label has a non-empty label vocabulary', ({ config }) => {
    // Not asserted unique: ImageNet-1k genuinely repeats a few class names, and
    // the array has to mirror the model's output vocabulary exactly.
    expect(((config.modelOpts as Node).labels as unknown[]).length).toBeGreaterThan(0);
  });

  // Only the speech-to-text configs themselves, not the VAD config nested inside them.
  it.each(allConfigs.filter(({ config }) => Array.isArray(config.supportedLanguages)))(
    '$label bundles a tokenizer, a VAD model and its supported languages',
    ({ config }) => {
      expect(typeof config.tokenizerPath).toBe('string');
      expect(config.vadModel).toMatchObject({ modelPath: expect.any(String) });
      expect(config.supportedLanguages).toEqual(expect.any(Array));
      expect((config.supportedLanguages as unknown[]).length).toBeGreaterThan(0);
    }
  );

  it.each(allConfigs.filter(({ label }) => label.startsWith('textToImage.')))(
    '$label bundles a tokenizer',
    ({ config }) => {
      expect(typeof config.tokenizerPath).toBe('string');
    }
  );

  it.each(allConfigs.filter(({ label }) => label.startsWith('textEmbeddings.')))(
    '$label bundles a tokenizer',
    ({ config }) => {
      expect(typeof config.tokenizerPath).toBe('string');
    }
  );

  it('keeps every numeric option finite', () => {
    const numbers = (node: unknown): number[] => {
      if (typeof node === 'number') return [node];
      if (Array.isArray(node)) return node.flatMap(numbers);
      if (isObject(node)) return Object.values(node).flatMap(numbers);
      return [];
    };

    expect(numbers(models).filter((n) => !Number.isFinite(n))).toEqual([]);
  });

  it.each(allConfigs.filter(({ config }) => isObject(config.modelOpts)))(
    '$label declares the preprocessing every image task needs',
    ({ config }) => {
      const opts = config.modelOpts as Node;
      if (!('resizeMode' in opts)) return; // non-image task
      expect(['stretch', 'letterbox', 'crop']).toContain(opts.resizeMode);
      expect(['nearest', 'area', 'cubic', 'lanczos', 'linear']).toContain(opts.interpolation);
      expect(opts.normalizeOpts).toBeDefined();
    }
  );
});
