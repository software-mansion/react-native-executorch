/**
 * A small in-memory vector store with nearest-neighbor search.
 */

import { RnExecuTorchError } from '../core/error';

/**
 * How a {@link VectorStore} scores a stored vector against a query.
 *
 * - `'cosine'`: cosine similarity, in `[-1, 1]`. Neither side has to be
 *   normalized. A zero vector scores 0 against everything.
 * - `'dot'`: the raw dot product. Equal to cosine for L2-normalized vectors
 *   (which every embedder in the `models` registry emits) and slightly cheaper.
 * @category Vector Store / Types
 */
export type VectorStoreMetric = 'cosine' | 'dot';

/**
 * Options for {@link createVectorStore}.
 * @category Vector Store / Types
 */
export type VectorStoreOptions = {
  /**
   * The length every vector must have. When omitted, the first vector added
   * fixes it.
   */
  readonly dimension?: number;
  /** The similarity metric used by {@link VectorStore.query}. Defaults to `'cosine'`. */
  readonly metric?: VectorStoreMetric;
};

/**
 * A vector held by a {@link VectorStore}, with its id and metadata.
 * @category Vector Store / Types
 */
export type VectorStoreEntry<Metadata> = {
  readonly id: string;
  /** A copy of the stored vector. */
  readonly vector: Float32Array;
  readonly metadata: Metadata;
};

/**
 * A single {@link VectorStore.query} result.
 * @category Vector Store / Types
 */
export type VectorStoreMatch<Metadata> = {
  readonly id: string;
  /** The similarity to the query under the store's metric; higher is closer. */
  readonly score: number;
  readonly metadata: Metadata;
};

/**
 * Options for a single {@link VectorStore.query} call.
 * @category Vector Store / Types
 */
export type VectorStoreQueryOptions<Metadata> = {
  /** Drops matches scoring below this value. */
  readonly minScore?: number;
  /** Only entries for which this returns `true` are considered. */
  readonly filter?: (id: string, metadata: Metadata) => boolean;
};

/**
 * An in-memory vector store. See {@link createVectorStore}.
 * @category Vector Store / Types
 */
export type VectorStore<Metadata = undefined> = {
  /** The vector length, or `undefined` until it is fixed by the first `add`. */
  readonly dimension: number | undefined;
  /** The similarity metric used by {@link VectorStore.query}. */
  readonly metric: VectorStoreMetric;
  /** The number of stored vectors. */
  readonly size: number;

  /**
   * Stores a vector under `id`, replacing any vector already stored under it.
   * The vector is copied, so the caller may reuse its buffer.
   * @param id The identifier to store the vector under.
   * @param vector The vector to store.
   * @param metadata Arbitrary data returned alongside the vector by `get` and
   * `query`. Optional when `Metadata` admits `undefined`.
   * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if the vector is
   * empty, has the wrong length, or contains a non-finite value.
   */
  add(
    id: string,
    vector: ArrayLike<number>,
    ...metadata: undefined extends Metadata ? [metadata?: Metadata] : [metadata: Metadata]
  ): void;

  /**
   * Removes the vector stored under `id`.
   * @param id The identifier to remove.
   * @returns `true` if a vector was removed, `false` if `id` was not stored.
   */
  remove(id: string): boolean;

  /**
   * Whether a vector is stored under `id`.
   * @param id The identifier to look up.
   * @returns `true` if `id` is stored.
   */
  has(id: string): boolean;

  /**
   * Returns the vector stored under `id`.
   * @param id The identifier to look up.
   * @returns The stored entry, or `undefined` if `id` is not stored.
   */
  get(id: string): VectorStoreEntry<Metadata> | undefined;

  /**
   * Returns the stored ids, in no particular order.
   * @returns The stored ids.
   */
  ids(): string[];

  /** Removes every vector. A dimension fixed by the first `add` is kept. */
  clear(): void;

  /**
   * Finds the `k` stored vectors most similar to `vector`.
   * @param vector The query vector.
   * @param k The maximum number of matches to return. Defaults to 10.
   * @param options Optional score threshold and entry filter.
   * See {@link VectorStoreQueryOptions}.
   * @returns Up to `k` matches, most similar first.
   * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if the vector has
   * the wrong length or `k` is not a non-negative integer.
   */
  query(
    vector: ArrayLike<number>,
    k?: number,
    options?: VectorStoreQueryOptions<Metadata>
  ): VectorStoreMatch<Metadata>[];
};

/**
 * The reciprocal L2 norm, or 0 for a zero vector so it scores 0 under cosine
 * instead of NaN.
 * @param data The array holding the vector.
 * @param offset The index of the vector's first element in `data`.
 * @param length The vector length.
 * @returns `1 / ||v||`, or 0 when `v` is zero.
 */
function inverseNorm(data: ArrayLike<number>, offset: number, length: number): number {
  let sum = 0;
  for (let i = 0; i < length; i++) {
    const v = data[offset + i]!;
    sum += v * v;
  }
  return sum > 0 ? 1 / Math.sqrt(sum) : 0;
}

/**
 * Checks `vector` against the store's dimension and returns the dimension it
 * implies (its own length while the store has none yet).
 * @param vector The vector to check.
 * @param dimension The store's dimension, if already fixed.
 * @param caller The method name to report in errors.
 * @returns The dimension the store has after accepting `vector`.
 */
function checkedDimension(
  vector: ArrayLike<number>,
  dimension: number | undefined,
  caller: string
): number {
  if (dimension === undefined) {
    if (vector.length === 0) {
      throw RnExecuTorchError('INVALID_ARGUMENT', `${caller}: vector must not be empty.`);
    }
    return vector.length;
  }
  if (vector.length !== dimension) {
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
      `${caller}: expected a vector of length ${dimension}, got ${vector.length}.`
    );
  }
  return dimension;
}

/**
 * Restores the min-heap property downward from `i`, ordering by `scores`.
 * @param heap The row indices, as a binary min-heap.
 * @param scores The score of each heap slot, permuted alongside `heap`.
 * @param size The number of occupied heap slots.
 * @param i The slot to sift down from.
 */
function siftDown(heap: Int32Array, scores: Float64Array, size: number, i: number): void {
  for (;;) {
    const left = 2 * i + 1;
    const right = left + 1;
    let smallest = i;
    if (left < size && scores[left]! < scores[smallest]!) smallest = left;
    if (right < size && scores[right]! < scores[smallest]!) smallest = right;
    if (smallest === i) return;
    [heap[i], heap[smallest]] = [heap[smallest]!, heap[i]!];
    [scores[i], scores[smallest]] = [scores[smallest]!, scores[i]!];
    i = smallest;
  }
}

/**
 * Restores the min-heap property upward from `i`, ordering by `scores`.
 * @param heap The row indices, as a binary min-heap.
 * @param scores The score of each heap slot, permuted alongside `heap`.
 * @param i The slot to sift up from.
 */
function siftUp(heap: Int32Array, scores: Float64Array, i: number): void {
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2);
    if (scores[parent]! <= scores[i]!) return;
    [heap[i], heap[parent]] = [heap[parent]!, heap[i]!];
    [scores[i], scores[parent]] = [scores[parent]!, scores[i]!];
    i = parent;
  }
}

/**
 * Creates an in-memory vector store with exact (brute-force) nearest-neighbor
 * search.
 *
 * The store takes plain vectors, so it works with any embedder: the
 * `models.textEmbeddings` and `models.imageEmbeddings` ones, or vectors computed
 * elsewhere. Vectors live in one contiguous `Float32Array`, and a query scans
 * all of them, which takes a few milliseconds for tens of thousands of
 * 384-dimensional vectors. Nothing is persisted.
 * @category Vector Store / Functions
 * @typeParam Metadata The type of the data stored alongside each vector.
 * @param options The vector dimension and similarity metric.
 * See {@link VectorStoreOptions}.
 * @returns An empty {@link VectorStore}.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if `dimension` is
 * not a positive integer or `metric` is unknown.
 * @example
 * ```ts
 * const store = createVectorStore<{ text: string }>();
 * store.add('a', await embedder.embed('The cat sleeps.'), { text: 'The cat sleeps.' });
 * const [best] = store.query(await embedder.embed('Where is the cat?'), 1);
 * ```
 */
export function createVectorStore<Metadata = undefined>(
  options?: VectorStoreOptions
): VectorStore<Metadata> {
  const metric = options?.metric ?? 'cosine';
  if (metric !== 'cosine' && metric !== 'dot') {
    throw RnExecuTorchError('INVALID_ARGUMENT', `createVectorStore: unknown metric '${metric}'.`);
  }
  let dimension = options?.dimension;
  if (dimension !== undefined && !(Number.isInteger(dimension) && dimension > 0)) {
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
      `createVectorStore: dimension must be a positive integer, got ${dimension}.`
    );
  }

  // Row `i` of `vectors` belongs to `ids[i]`. Removal moves the last row into
  // the hole, so rows stay packed and a query scans `size * dimension` floats.
  let vectors = new Float32Array(0);
  let inverseNorms = new Float32Array(0);
  const ids: string[] = [];
  const metadata: Metadata[] = [];
  const rowOf = new Map<string, number>();

  const store: VectorStore<Metadata> = {
    get dimension() {
      return dimension;
    },
    metric,
    get size() {
      return ids.length;
    },

    add(id, vector, ...rest) {
      const meta = rest[0] as Metadata;
      const dim = checkedDimension(vector, dimension, 'VectorStore.add');
      for (let i = 0; i < vector.length; i++) {
        if (!Number.isFinite(vector[i])) {
          throw RnExecuTorchError(
            'INVALID_ARGUMENT',
            `VectorStore.add: vector[${i}] is not a finite number.`
          );
        }
      }
      dimension = dim;

      let row = rowOf.get(id);
      if (row === undefined) {
        row = ids.length;
        if ((row + 1) * dim > vectors.length) {
          const capacity = Math.max(16, row * 2);
          const grown = new Float32Array(capacity * dim);
          grown.set(vectors);
          vectors = grown;
          const grownNorms = new Float32Array(capacity);
          grownNorms.set(inverseNorms);
          inverseNorms = grownNorms;
        }
        ids.push(id);
        metadata.push(meta);
        rowOf.set(id, row);
      } else {
        metadata[row] = meta;
      }
      vectors.set(vector, row * dim);
      inverseNorms[row] = inverseNorm(vectors, row * dim, dim);
    },

    remove(id) {
      const row = rowOf.get(id);
      if (row === undefined) return false;
      const last = ids.length - 1;
      if (row !== last) {
        const dim = dimension!;
        vectors.copyWithin(row * dim, last * dim, (last + 1) * dim);
        inverseNorms[row] = inverseNorms[last]!;
        ids[row] = ids[last]!;
        metadata[row] = metadata[last]!;
        rowOf.set(ids[row]!, row);
      }
      ids.pop();
      metadata.pop();
      rowOf.delete(id);
      return true;
    },

    has(id) {
      return rowOf.has(id);
    },

    get(id) {
      const row = rowOf.get(id);
      if (row === undefined) return undefined;
      const dim = dimension!;
      return {
        id,
        vector: vectors.slice(row * dim, (row + 1) * dim),
        metadata: metadata[row]!,
      };
    },

    ids() {
      return [...ids];
    },

    clear() {
      vectors = new Float32Array(0);
      inverseNorms = new Float32Array(0);
      ids.length = 0;
      metadata.length = 0;
      rowOf.clear();
    },

    query(vector, k = 10, queryOptions) {
      if (!(Number.isInteger(k) && k >= 0)) {
        throw RnExecuTorchError(
          'INVALID_ARGUMENT',
          `VectorStore.query: k must be a non-negative integer, got ${k}.`
        );
      }
      if (ids.length === 0 || k === 0) {
        if (dimension !== undefined) checkedDimension(vector, dimension, 'VectorStore.query');
        return [];
      }
      const dim = checkedDimension(vector, dimension, 'VectorStore.query');
      const queryScale = metric === 'cosine' ? inverseNorm(vector, 0, dim) : 1;
      const minScore = queryOptions?.minScore ?? -Infinity;
      const filter = queryOptions?.filter;

      // A min-heap of the best `k` rows seen so far: its root is the weakest
      // kept match, so each candidate costs one comparison unless it qualifies.
      const capacity = Math.min(k, ids.length);
      const heap = new Int32Array(capacity);
      const heapScores = new Float64Array(capacity);
      let heapSize = 0;

      for (let row = 0; row < ids.length; row++) {
        if (filter && !filter(ids[row]!, metadata[row]!)) continue;
        const offset = row * dim;
        let dot = 0;
        for (let i = 0; i < dim; i++) dot += vector[i]! * vectors[offset + i]!;
        const score = metric === 'cosine' ? dot * queryScale * inverseNorms[row]! : dot;
        if (score < minScore) continue;

        if (heapSize < capacity) {
          heap[heapSize] = row;
          heapScores[heapSize] = score;
          siftUp(heap, heapScores, heapSize);
          heapSize++;
        } else if (score > heapScores[0]!) {
          heap[0] = row;
          heapScores[0] = score;
          siftDown(heap, heapScores, heapSize, 0);
        }
      }

      const matches: VectorStoreMatch<Metadata>[] = [];
      for (let i = 0; i < heapSize; i++) {
        const row = heap[i]!;
        matches.push({ id: ids[row]!, score: heapScores[i]!, metadata: metadata[row]! });
      }
      return matches.sort((a, b) => b.score - a.score);
    },
  };

  return store;
}
