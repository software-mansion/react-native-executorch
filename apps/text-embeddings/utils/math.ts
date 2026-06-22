import {
  RnExecutorchError,
  RnExecutorchErrorCode,
  EmbeddingResult,
} from 'react-native-executorch';

export const dotProduct = (a: Float32Array, b: Float32Array) => {
  if (a.length !== b.length) {
    throw new RnExecutorchError(
      RnExecutorchErrorCode.WrongDimensions,
      `dotProduct needs both vector to have the same length: got a: ${a.length}, b: ${b.length}`
    );
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
};

/**
 * ColBERT late-interaction score between a query and a document encoding:
 *   score = Σ_q max_d ( q · d )
 * For each query token, the max dot over non-skiplist doc tokens, summed.
 * Per-token vectors are L2-normalized by the graph, so dot == cosine. Scoring
 * is the consumer's concern (the library just yields the per-token vectors),
 * so this lives in the app alongside dotProduct.
 */
export const maxSim = (
  query: EmbeddingResult,
  doc: EmbeddingResult,
  skiplistIds: number[] = []
) => {
  const dim = query.embeddingDim;
  const skip = new Set(skiplistIds);
  let score = 0;
  for (let qi = 0; qi < query.numTokens; qi++) {
    const qOff = qi * dim;
    let best = -Infinity;
    for (let di = 0; di < doc.numTokens; di++) {
      if (skip.has(doc.tokenIds[di]!)) continue;
      const dOff = di * dim;
      let dot = 0;
      for (let k = 0; k < dim; k++) {
        dot += (query.vectors[qOff + k] ?? 0) * (doc.vectors[dOff + k] ?? 0);
      }
      if (dot > best) best = dot;
    }
    if (best !== -Infinity) score += best;
  }
  return score;
};
