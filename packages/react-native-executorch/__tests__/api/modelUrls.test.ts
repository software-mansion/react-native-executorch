import { models } from '../../src/constants/modelRegistry';
import { URL_PREFIX } from '../../src/constants/versions';

type Accessor = (...args: unknown[]) => unknown;

function isAccessor(v: unknown): v is Accessor {
  return typeof v === 'function';
}

function walk(
  node: unknown,
  path: string[],
  visit: (path: string[], leaf: Accessor) => void
) {
  if (isAccessor(node)) {
    visit(path, node);
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      walk(v, [...path, k], visit);
    }
  }
}

const PARAMETERIZED_ACCESSORS = new Set(['ocr.craft']);

// Collect every (path, string-valued field) pair from the resolved config of
// every accessor. URL fields are detected by value (starts with "http"), so
// new URL-bearing fields are picked up automatically without per-field opt-in.
type UrlEntry = { path: string; field: string; url: string };

function collectUrls(): UrlEntry[] {
  const urls: UrlEntry[] = [];
  walk(models, [], (path, accessor) => {
    const name = path.join('.');
    if (PARAMETERIZED_ACCESSORS.has(name)) return;
    const config = accessor();
    collectFromValue(name, config, urls);
  });
  return urls;
}

function collectFromValue(path: string, value: unknown, out: UrlEntry[]) {
  if (typeof value === 'string' && /^https?:\/\//.test(value)) {
    out.push({ path, field: '<scalar>', url: value });
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === 'string' && /^https?:\/\//.test(v)) {
        out.push({ path, field: k, url: v });
      } else if (v && typeof v === 'object') {
        collectFromValue(`${path}.${k}`, v, out);
      }
    }
  }
}

describe('Model registry URLs', () => {
  const urls = collectUrls();

  it('contains URL-bearing fields', () => {
    expect(urls.length).toBeGreaterThan(0);
  });

  it.each(urls.map((e) => [`${e.path} (${e.field})`, e.url] as const))(
    '%s is a non-empty https URL',
    (_label, url) => {
      expect(url).toMatch(/^https:\/\/\S+$/);
      expect(url).not.toBe('');
    }
  );

  it.each(urls.map((e) => [`${e.path} (${e.field})`, e.url] as const))(
    '%s points at the software-mansion HuggingFace org',
    (_label, url) => {
      expect(url.startsWith(URL_PREFIX)).toBe(true);
    }
  );
});
