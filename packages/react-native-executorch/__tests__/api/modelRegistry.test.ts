import { models } from '../../src/constants/modelRegistry';

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

type Entry = { name: string; path: string[]; value: unknown };

// Accessors that take required arguments and so can't be invoked with no
// args. Inconsistent with the rest of the registry, but kept as-is for now.
// Listed here so the walker can skip them.
const PARAMETERIZED_ACCESSORS = new Set(['ocr.craft']);

function collect(): Entry[] {
  const out: Entry[] = [];
  walk(models, [], (path, accessor) => {
    const name = path.join('.');
    if (PARAMETERIZED_ACCESSORS.has(name)) return;
    out.push({ name, path, value: accessor() });
  });
  return out;
}

describe('Model registry', () => {
  const entries = collect();

  it('contains accessors', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries.map((e) => [e.name, e.value] as const))(
    '%s returns a non-null object',
    (_name, value) => {
      expect(value).not.toBeNull();
      expect(typeof value).toBe('object');
    }
  );

  // text_to_speech accessors return TextToSpeechModelConfig (no modelName);
  // every other branch returns { modelName, modelSource, ... }.
  const standard = entries.filter((e) => e.path[0] !== 'text_to_speech');

  it.each(standard.map((e) => [e.name, e.value] as const))(
    '%s exposes a non-empty modelName',
    (_name, value) => {
      const v = value as { modelName?: unknown };
      expect(typeof v.modelName).toBe('string');
      expect(v.modelName).not.toBe('');
    }
  );

  it('non-TTS modelNames are unique within each category', () => {
    const byCategory = new Map<string, string[]>();
    for (const { path, value } of standard) {
      const cat = path[0]!;
      const modelName = (value as { modelName: string }).modelName;
      const bucket = byCategory.get(cat) ?? [];
      bucket.push(modelName);
      byCategory.set(cat, bucket);
    }
    const collisions: Array<{ category: string; duplicates: string[] }> = [];
    for (const [category, names] of byCategory) {
      const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
      if (duplicates.length > 0) collisions.push({ category, duplicates });
    }
    expect(collisions).toEqual([]);
  });
});
