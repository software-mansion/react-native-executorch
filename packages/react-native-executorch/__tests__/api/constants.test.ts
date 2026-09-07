/**
 * Invariants of the label and landmark constants.
 *
 * These arrays are positional: index `i` has to be the class the model emits at
 * output slot `i`. Nothing in the type system enforces that, and a single
 * inserted or deleted entry shifts every label after it — producing confidently
 * wrong predictions rather than an error.
 */
import * as constants from '../../src/constants';
import { models } from '../../src/models';

// Sizes are asserted by name rather than by passing the arrays through
// `it.each`, which would print a thousand ImageNet labels into the test title.
const VOCABULARIES = {
  IMAGENET1K_LABELS: 1000,
  PASCAL_VOC_LABELS: 21,
  COCO_CLASSES: 91,
  COCO_CLASSES_YOLO: 80,
} as const;

const vocabulary = (name: keyof typeof VOCABULARIES): readonly string[] => constants[name];

describe('dataset label arrays', () => {
  it.each(Object.entries(VOCABULARIES))('%s has exactly %i entries', (name, expected) => {
    expect(vocabulary(name as keyof typeof VOCABULARIES)).toHaveLength(expected);
  });

  it.each(Object.keys(VOCABULARIES))('%s holds only non-empty, trimmed strings', (name) => {
    for (const label of vocabulary(name as keyof typeof VOCABULARIES)) {
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
      expect(label).toBe(label.trim());
    }
  });

  it('starts PASCAL VOC and COCO with their background class', () => {
    expect(constants.PASCAL_VOC_LABELS[0]).toBe('background');
    expect(constants.COCO_CLASSES[0]).toBe('background');
  });

  it('keeps the COCO id gaps padded, so class ids stay aligned', () => {
    // The 91-entry COCO list is index-aligned to the dataset's sparse ids, with
    // the unused ones filled in — dropping them would shift every later class.
    expect(constants.COCO_CLASSES.filter((label) => label === 'N/A').length).toBe(
      constants.COCO_CLASSES.length - constants.COCO_CLASSES_YOLO.length - 1
    );
  });

  it('starts the YOLO class list at a real class, with no background slot', () => {
    expect(constants.COCO_CLASSES_YOLO[0]).toBe('person');
    expect(constants.COCO_CLASSES_YOLO).not.toContain('__background__');
  });

  it('keeps the YOLO list a subset of the padded COCO list', () => {
    const padded = new Set<string>(constants.COCO_CLASSES);
    expect(constants.COCO_CLASSES_YOLO.filter((label) => !padded.has(label))).toEqual([]);
  });

  it('has no duplicates in COCO once the padding is removed', () => {
    const real = constants.COCO_CLASSES.filter((label) => label !== 'N/A');
    expect(new Set(real).size).toBe(real.length);
  });

  it('leaves ImageNet duplicates in place — the array mirrors the model vocabulary', () => {
    // ImageNet-1k genuinely repeats a couple of names ("maillot", "crane").
    // The array has to keep them: dropping one would shift every later index.
    expect(new Set(constants.IMAGENET1K_LABELS).size).toBeLessThan(
      constants.IMAGENET1K_LABELS.length
    );
  });

  it('has no duplicates in the deduplicated detection vocabularies', () => {
    expect(new Set(constants.COCO_CLASSES_YOLO).size).toBe(constants.COCO_CLASSES_YOLO.length);
    expect(new Set(constants.PASCAL_VOC_LABELS).size).toBe(constants.PASCAL_VOC_LABELS.length);
  });
});

describe('landmark arrays', () => {
  it('lists the six BlazeFace landmarks', () => {
    expect(constants.BLAZEFACE_LANDMARKS).toHaveLength(6);
  });

  it('lists the seventeen COCO body keypoints', () => {
    expect(constants.COCO_LANDMARKS).toHaveLength(17);
  });

  it.each([
    ['BLAZEFACE_LANDMARKS', constants.BLAZEFACE_LANDMARKS],
    ['COCO_LANDMARKS', constants.COCO_LANDMARKS],
  ] as const)('%s names every landmark uniquely', (_name, landmarks) => {
    expect(new Set(landmarks).size).toBe(landmarks.length);
  });

  it('names COCO keypoints in the canonical order', () => {
    expect(constants.COCO_LANDMARKS[0]).toBe('nose');
    expect(constants.COCO_LANDMARKS.at(-1)).toBe('rightAnkle');
  });

  it('names every landmark in camelCase', () => {
    for (const landmark of [...constants.BLAZEFACE_LANDMARKS, ...constants.COCO_LANDMARKS]) {
      expect(landmark).toMatch(/^[a-z][a-zA-Z]*$/);
    }
  });
});

describe('IMAGENET_NORM', () => {
  it('carries a per-channel mean and standard deviation', () => {
    expect(constants.IMAGENET_NORM.alpha).toHaveLength(3);
    expect(constants.IMAGENET_NORM.beta).toHaveLength(3);
  });

  it('holds finite coefficients', () => {
    expect(
      [...constants.IMAGENET_NORM.alpha, ...constants.IMAGENET_NORM.beta].every(Number.isFinite)
    ).toBe(true);
  });
});

describe('BIOES privacy-filter label spaces', () => {
  const SPACES = {
    PRIVACY_FILTER_OPENAI_LABELS: 8,
    PRIVACY_FILTER_NEMOTRON_LABELS: 55,
  } as const;

  const space = (name: keyof typeof SPACES): readonly string[] => constants[name];

  it.each(Object.entries(SPACES))(
    '%s holds one outside tag plus four per entity',
    (name, entities) => {
      // The arrays are consumed positionally: the pipeline uses the index as
      // the label id and derives the entity type from the tag's suffix, so a
      // single missing prefix shifts every id after it.
      expect(space(name as keyof typeof SPACES)).toHaveLength(1 + entities * 4);
    }
  );

  it.each(Object.keys(SPACES))("%s starts with the outside tag 'O'", (name) => {
    expect(space(name as keyof typeof SPACES)[0]).toBe('O');
  });

  it.each(Object.keys(SPACES))('%s gives every entity all four BIOES prefixes', (name) => {
    const labels = space(name as keyof typeof SPACES).slice(1);
    const byEntity = new Map<string, string[]>();
    for (const label of labels) {
      const [prefix, entity] = [label.slice(0, 1), label.slice(2)];
      byEntity.set(entity, [...(byEntity.get(entity) ?? []), prefix]);
    }

    const incomplete = [...byEntity.entries()]
      .filter(([, prefixes]) => prefixes.join('') !== 'BIES')
      .map(([entity, prefixes]) => `${entity}: ${prefixes.join('')}`);

    expect(incomplete).toEqual([]);
  });

  it.each(Object.keys(SPACES))('%s names every label exactly once', (name) => {
    const labels = space(name as keyof typeof SPACES);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it.each(Object.keys(SPACES))('%s names every entity in snake_case', (name) => {
    for (const label of space(name as keyof typeof SPACES).slice(1)) {
      expect(label).toMatch(/^[BIES]-[a-z][a-z0-9_]*$/);
    }
  });

  it('keeps the two label spaces independent', () => {
    // Each array mirrors its own model's `id2label`, so they do NOT share an
    // entity vocabulary: the base model prefixes its types with `private_`
    // where the larger one does not. Stated here so a future edit does not
    // "fix" one array into the other's naming and silently shift its ids.
    const nemotron = new Set<string>(constants.PRIVACY_FILTER_NEMOTRON_LABELS);
    expect(
      constants.PRIVACY_FILTER_OPENAI_LABELS.filter((label) => !nemotron.has(label))
    ).not.toEqual([]);
  });
});

describe('SUPERTONIC_DEFAULT_VOICE_NAMES', () => {
  it('lists five female and five male voices', () => {
    const names = constants.SUPERTONIC_DEFAULT_VOICE_NAMES;
    expect(names.filter((name) => name.startsWith('F'))).toHaveLength(5);
    expect(names.filter((name) => name.startsWith('M'))).toHaveLength(5);
  });

  it('names every voice uniquely, as a gender letter and an index', () => {
    const names = constants.SUPERTONIC_DEFAULT_VOICE_NAMES;
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name).toMatch(/^[FM][1-5]$/);
  });
});

describe('registry ↔ constants alignment', () => {
  /** Every label array actually referenced by a registry entry. */
  const referenced = (function collect(node: unknown): unknown[][] {
    if (Array.isArray(node)) return [];
    if (node && typeof node === 'object') {
      const own = 'labels' in node ? [(node as { labels: unknown[] }).labels] : [];
      return [...own, ...Object.values(node).flatMap(collect)];
    }
    return [];
  })(models);

  it('references at least one label array', () => {
    expect(referenced.length).toBeGreaterThan(0);
  });

  it('sources every dataset-sized vocabulary from constants.ts', () => {
    // Small inline arrays are fine — a binary segmenter's `['background',
    // 'person']` needs no shared constant. A full dataset vocabulary pasted
    // into `models.ts` would be a second copy free to drift from this one.
    const exported = new Set<unknown>(Object.values(constants));
    const orphans = referenced
      .filter((labels) => labels.length > 5)
      .filter((labels) => !exported.has(labels))
      .map((labels) => `${labels.length} labels starting ${String(labels[0])}`);

    expect(orphans).toEqual([]);
  });
});
