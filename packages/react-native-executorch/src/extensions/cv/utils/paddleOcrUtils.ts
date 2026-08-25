/**
 * DBNet contour tracing and text quad extraction utilities for PP-OCRv6.
 */

import { rnexecutorchJsi } from '../../../native/bridge';
import type { Tensor } from '../../../core/tensor';
import { RnExecuTorchError } from '../../../core/error';
import type { Quad } from '../ops/quad';

// Parses the native decode's flat output, 8 numbers per quad: x0,y0..x3,y3.
function quadsFromFlat(flat: ArrayLike<number>): Quad[] {
  'worklet';
  if (flat.length % 8 !== 0) {
    throw RnExecuTorchError(
      'EXECUTION_FAILED',
      `extractDbnetTextQuads: native decode returned ${flat.length} values, expected a multiple of 8.`
    );
  }
  const quads: Quad[] = [];
  for (let i = 0; i < flat.length; i += 8) {
    quads.push([
      { x: flat[i]!, y: flat[i + 1]! },
      { x: flat[i + 2]!, y: flat[i + 3]! },
      { x: flat[i + 4]!, y: flat[i + 5]! },
      { x: flat[i + 6]!, y: flat[i + 7]! },
    ]);
  }
  return quads;
}

/**
 * Thresholds for {@link extractDbnetTextQuads}.
 */
export type DbnetDecodeOptions = {
  /** Binarization threshold on the probability map. */
  readonly binThreshold: number;
  /** Minimum mean box score to keep a candidate. */
  readonly boxThreshold: number;
  /** How far to expand (unclip) each shrunk box. */
  readonly unclipRatio: number;
  /** Discard boxes with a side smaller than this, in pixels. */
  readonly minBoxSide: number;
  /** Cap on contour candidates scored per map. */
  readonly maxCandidates: number;
};

/**
 * Decodes a DBNet probability map into oriented text quads: binarizes the map,
 * traces contours, scores each candidate by its mean probability and unclips the
 * survivors back to their unshrunk size.
 * @param probabilityMap The `detect` output, shape `[1, 1, H, W]`, post-sigmoid.
 * @param options Decode thresholds. See {@link DbnetDecodeOptions}.
 * @returns The decoded quads, in detector-input pixel space and arbitrary order.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if tensor shape or
 * data type is invalid, `RESOURCE_BUSY` if the tensor is in use,
 * `RESOURCE_DISPOSED` if the tensor was disposed, or `EXECUTION_FAILED` if
 * native decode returns invalid output.
 */
export function extractDbnetTextQuads(probabilityMap: Tensor, options: DbnetDecodeOptions): Quad[] {
  'worklet';
  const flat = rnexecutorchJsi.cv.extractDbnetTextQuads(probabilityMap, options) as Float32Array;
  return quadsFromFlat(flat);
}
