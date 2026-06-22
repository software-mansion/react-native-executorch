import { EmbeddingResult } from '../types/textEmbeddings';

/**
 * Get the single pooled embedding vector from a result. Convenience for the
 * common single-vector case: the exported graph pools + L2-normalizes to a
 * [1, embeddingDim] output, so this returns row 0.
 *
 * For multi-vector (late-interaction) models, prefer the full per-token
 * vectors (`getTokenVectors`); row 0 alone is not a meaningful sentence
 * embedding there.
 *
 * @category Utils
 */
export function toVector(result: EmbeddingResult): Float32Array {
  return result.vectors.slice(0, result.embeddingDim);
}

/**
 * Split a result's flat `vectors` buffer into per-token rows
 * (`numTokens` arrays of length `embeddingDim`). Useful for inspecting or
 * storing individual token vectors (e.g. a multi-vector vector DB).
 *
 * @category Utils
 */
export function getTokenVectors(result: EmbeddingResult): Float32Array[] {
  const { vectors, numTokens, embeddingDim } = result;
  const rows: Float32Array[] = [];
  for (let i = 0; i < numTokens; i++) {
    rows.push(vectors.subarray(i * embeddingDim, (i + 1) * embeddingDim));
  }
  return rows;
}

/**
 * Late-interaction MaxSim score between a query and a document encoding:
 *
 *   score = Σ_q  max_d ( q · d )
 *
 * For each query token, takes the max dot product over all (non-skiplist)
 * document tokens, then sums across query tokens. Per-token vectors are
 * L2-normalized by the graph, so a dot product is a cosine.
 *
 * `skiplistIds` (e.g. punctuation token ids) are excluded from the document
 * side, matching ColBERT's document skiplist. Pass `[]` to score every token.
 *
 * @category Utils
 */
export function maxSim(
  query: EmbeddingResult,
  doc: EmbeddingResult,
  skiplistIds: number[] = []
): number {
  const dim = query.embeddingDim;
  const q = query.vectors;
  const d = doc.vectors;
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
        dot += (q[qOff + k] ?? 0) * (d[dOff + k] ?? 0);
      }
      if (dot > best) best = dot;
    }
    if (best !== -Infinity) score += best;
  }
  return score;
}
