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
 * The rows are zero-copy `subarray` VIEWS over `result.vectors` — valid only
 * while that buffer is alive and not mutated. Copy them (e.g. `new
 * Float32Array(row)`) before storing beyond the result's lifetime. (`toVector`
 * by contrast returns an independent copy.)
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
