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
 * A leaf that a `create<Task>` factory could be handed: it names its model
 * file, or — for a pipeline assembled from several `.pte` files, like
 * Supertonic TTS — the record of them.
 */
const isConfig = (value: unknown): value is Node =>
  isObject(value) &&
  (typeof value.modelPath === 'string' ||
    (isObject(value.modelPaths) &&
      Object.values(value.modelPaths).every((path) => typeof path === 'string')));

/**
 * The model file(s) a config names, as one comparable identity.
 */
const modelPathsOf = (config: Node): string =>
  typeof config.modelPath === 'string'
    ? config.modelPath
    : Object.values(config.modelPaths as Node)
        .map(String)
        .sort()
        .join('|');

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
 * Every group that names a default alongside the variants it can point at —
 * the `{ DEFAULT: X_FP32, XNNPACK_FP32: X_FP32, COREML_FP16: X_FP16 }` shape.
 *
 * A group's `DEFAULT` does not have to be one of its immediate siblings: a
 * family like `objectDetection.YOLO26` defaults to a config that lives two
 * levels down, under a scale and then an input size.
 */
function variantGroups(node: unknown, path: string[] = []): { label: string; group: Node }[] {
  if (!isObject(node)) return [];
  const here = isConfig(node.DEFAULT) ? [{ label: path.join('.'), group: node }] : [];
  const nested = Object.entries(node)
    .filter(([key, value]) => key !== 'DEFAULT' && isObject(value))
    .flatMap(([key, value]) => variantGroups(value, [...path, key]));
  return [...here, ...nested];
}

/**
 * The named backend variants a group lists directly, excluding its `DEFAULT`
 * alias and any nested scale/size families.
 */
const namedVariants = (group: Node): Node[] =>
  Object.entries(group)
    .filter(([key, value]) => key !== 'DEFAULT' && isUpperKey(key) && isConfig(value))
    .map(([, value]) => value as Node);

const BACKENDS = /^(xnnpack|coreml|mlx|qnn|vulkan)$/;
// `spinquant` is a quantization recipe rather than a plain precision, but it is
// what the published Llama builds are named after.
const PRECISIONS = /^(fp32|fp16|bf16|int8|int4|8da4w|4w|dynamic|spinquant)$/;

const basename = (url: string) => url.split('/').pop()!.replace('.pte', '');

/** The backend a `.pte` filename declares, or `undefined` when it declares none. */
const backendOf = (url: string): string | undefined => {
  const backend = basename(url).split('_').at(-2) ?? '';
  return BACKENDS.test(backend) ? backend : undefined;
};

const urls = urlLeaves(models);
const pteUrls = urls.filter(([, url]) => url.endsWith('.pte'));
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

  it('names every backend-tagged .pte after the modelname_backend_precision contract', () => {
    const offenders = pteUrls
      .filter(([, url]) => backendOf(url) !== undefined)
      .filter(([, url]) => !PRECISIONS.test(basename(url).split('_').at(-1)!))
      .map(([path, url]) => `${path}: ${basename(url)}`);

    expect(offenders).toEqual([]);
  });

  // The rule above only bites on files that carry a backend at all, so the
  // exceptions are pinned here rather than left to silently opt out: a new
  // untagged `.pte` has to be added deliberately.
  it('leaves only the known exceptions untagged', () => {
    // Kokoro's grapheme-to-phoneme models are published per language rather
    // than per backend, under `phonemizer/<lang>/`.
    const offenders = pteUrls
      .filter(([, url]) => backendOf(url) === undefined)
      .filter(([, url]) => !/\/phonemizer\/[a-z-]+\/phonemizer_[a-z_]+\.pte$/.test(url))
      .map(([path, url]) => `${path}: ${url}`);

    expect(offenders).toEqual([]);
  });

  it('stores every backend-tagged .pte under a folder naming its backend', () => {
    const offenders = pteUrls
      .filter(([, url]) => backendOf(url) !== undefined)
      .filter(([, url]) => {
        // Kokoro nests a variant folder below the backend one
        // (`xnnpack/polish/…`), so the backend is looked for anywhere in the
        // path rather than only in the segment above the file.
        const segments = url.split('/').slice(0, -1);
        return !segments.includes(backendOf(url)!);
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

  it.each(allGroups)('$label defaults to a config it actually offers', ({ group }) => {
    // The default has to be reachable through the group's own tree, otherwise
    // `models.x.Y` and every `models.x.Y.<variant>` silently disagree. Compare
    // the config fields only: a variant may carry further nested groups (a size
    // family, say) that the default alias never includes.
    const offered = configs(group).map(({ config }) => JSON.stringify(configPart(config)));
    expect(offered).toContain(JSON.stringify(configPart(group.DEFAULT as Node)));
  });

  it.each(allGroups.filter(({ group }) => namedVariants(group).length > 0))(
    '$label gives every named variant distinct model files',
    ({ group }) => {
      const paths = namedVariants(group).map(modelPathsOf);
      expect(new Set(paths).size).toBe(paths.length);
    }
  );

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
