/**
 * The in-memory vector store.
 *
 * It is pure TypeScript, so these cases are the whole of its correctness. The
 * parts most likely to go wrong quietly are the ones that move rows around —
 * swap-on-remove and growth — because a stale row index still returns *a*
 * vector, just the wrong one.
 */
import { createVectorStore } from '../../src/extensions/vectorStore';

describe('createVectorStore', () => {
  it('ranks by cosine similarity, most similar first', () => {
    const store = createVectorStore();
    store.add('x', [1, 0]);
    store.add('y', [0, 1]);
    store.add('xy', [1, 1]);

    const matches = store.query([2, 0.1], 3);

    expect(matches.map((m) => m.id)).toEqual(['x', 'xy', 'y']);
    expect(matches[0]!.score).toBeCloseTo(2 / Math.hypot(2, 0.1));
  });

  it('does not require normalized vectors under cosine', () => {
    const store = createVectorStore();
    store.add('long', [10, 0]);
    store.add('short', [0.1, 0.1]);

    const [best] = store.query([1, 1], 1);

    expect(best!.id).toBe('short');
    expect(best!.score).toBeCloseTo(1);
  });

  it('scores by the raw dot product under the dot metric', () => {
    const store = createVectorStore({ metric: 'dot' });
    store.add('long', [10, 0]);
    store.add('short', [0.1, 0.1]);

    const matches = store.query([1, 1]);

    expect(matches.map((m) => [m.id, m.score])).toEqual([
      ['long', 10],
      ['short', expect.closeTo(0.2)],
    ]);
  });

  it('returns at most k matches, and all of them when k exceeds the size', () => {
    const store = createVectorStore();
    for (let i = 0; i < 5; i++) store.add(`v${i}`, [1, i]);

    expect(store.query([1, 4], 2).map((m) => m.id)).toEqual(['v4', 'v3']);
    expect(store.query([1, 4], 50)).toHaveLength(5);
    expect(store.query([1, 4], 0)).toEqual([]);
  });

  it('defaults k to 10', () => {
    const store = createVectorStore();
    for (let i = 0; i < 12; i++) store.add(`v${i}`, [1, i]);

    expect(store.query([1, 0])).toHaveLength(10);
  });

  it('returns metadata with each match and from get', () => {
    const store = createVectorStore<{ text: string }>();
    store.add('a', [1, 0], { text: 'alpha' });

    expect(store.query([1, 0])[0]!.metadata).toEqual({ text: 'alpha' });
    expect(store.get('a')!.metadata).toEqual({ text: 'alpha' });
  });

  it('replaces the vector and metadata when an id is added again', () => {
    const store = createVectorStore<string>();
    store.add('a', [1, 0], 'old');
    store.add('a', [0, 1], 'new');

    expect(store.size).toBe(1);
    expect(store.get('a')).toEqual({ id: 'a', vector: new Float32Array([0, 1]), metadata: 'new' });
    expect(store.query([0, 1])[0]!.score).toBeCloseTo(1);
  });

  it('keeps every other entry intact when removing from the middle', () => {
    const store = createVectorStore<number>();
    const vectors = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 0],
    ];
    vectors.forEach((v, i) => store.add(`v${i}`, v, i));

    expect(store.remove('v1')).toBe(true);
    expect(store.remove('v1')).toBe(false);

    expect(store.size).toBe(3);
    expect(store.has('v1')).toBe(false);
    for (const i of [0, 2, 3]) {
      expect(store.get(`v${i}`)).toEqual({
        id: `v${i}`,
        vector: new Float32Array(vectors[i]!),
        metadata: i,
      });
      expect(store.query(vectors[i]!, 1)[0]!.id).toBe(`v${i}`);
    }
    expect(store.ids().sort()).toEqual(['v0', 'v2', 'v3']);
  });

  it('keeps vectors intact as the storage grows', () => {
    const store = createVectorStore<number>();
    for (let i = 0; i < 100; i++) store.add(`v${i}`, [Math.cos(i), Math.sin(i), i], i);

    expect(store.size).toBe(100);
    expect(store.get('v0')!.vector).toEqual(new Float32Array([1, 0, 0]));
    expect(store.get('v99')!.vector).toEqual(new Float32Array([Math.cos(99), Math.sin(99), 99]));
  });

  it('copies vectors on add and on get', () => {
    const store = createVectorStore();
    const source = new Float32Array([1, 2]);
    store.add('a', source);
    source[0] = 99;

    const entry = store.get('a')!;
    entry.vector[1] = 99;

    expect(store.get('a')!.vector).toEqual(new Float32Array([1, 2]));
  });

  it('applies the filter and the score threshold', () => {
    const store = createVectorStore<{ lang: string }>();
    store.add('en1', [1, 0], { lang: 'en' });
    store.add('en2', [0, 1], { lang: 'en' });
    store.add('pl', [1, 0.1], { lang: 'pl' });

    const english = store.query([1, 0], 10, { filter: (_id, meta) => meta.lang === 'en' });
    expect(english.map((m) => m.id)).toEqual(['en1', 'en2']);

    const close = store.query([1, 0], 10, { minScore: 0.5 });
    expect(close.map((m) => m.id)).toEqual(['en1', 'pl']);
  });

  it('scores a zero vector 0 under cosine instead of NaN', () => {
    const store = createVectorStore();
    store.add('zero', [0, 0]);
    store.add('x', [1, 0]);

    expect(store.query([1, 0]).map((m) => [m.id, m.score])).toEqual([
      ['x', 1],
      ['zero', 0],
    ]);
    expect(store.query([0, 0]).every((m) => m.score === 0)).toBe(true);
  });

  it('fixes the dimension on the first add, and keeps it through clear', () => {
    const store = createVectorStore();
    expect(store.dimension).toBeUndefined();

    store.add('a', [1, 2, 3]);
    expect(store.dimension).toBe(3);

    store.clear();
    expect(store.size).toBe(0);
    expect(store.dimension).toBe(3);
    expect(() => store.add('b', [1, 2])).toThrow(/expected a vector of length 3, got 2/);
  });

  it('rejects vectors of the wrong length, empty or non-finite', () => {
    const store = createVectorStore({ dimension: 2 });

    expect(() => store.add('a', [1, 2, 3])).toThrow(
      expect.objectContaining({ code: 'INVALID_ARGUMENT' })
    );
    expect(() => store.add('a', [1, NaN])).toThrow(/vector\[1\] is not a finite number/);
    expect(() => createVectorStore().add('a', [])).toThrow(/must not be empty/);
    expect(() => store.query([1, 2, 3])).toThrow(/expected a vector of length 2/);
    expect(store.size).toBe(0);
  });

  it('rejects an invalid k, dimension or metric', () => {
    const store = createVectorStore();
    store.add('a', [1]);

    expect(() => store.query([1], -1)).toThrow(/k must be a non-negative integer/);
    expect(() => store.query([1], 1.5)).toThrow(/k must be a non-negative integer/);
    expect(() => createVectorStore({ dimension: 0 })).toThrow(/positive integer/);
    expect(() => createVectorStore({ metric: 'l2' as never })).toThrow(/unknown metric 'l2'/);
  });

  it('returns nothing from an empty store', () => {
    expect(createVectorStore().query([1, 2])).toEqual([]);
  });
});
