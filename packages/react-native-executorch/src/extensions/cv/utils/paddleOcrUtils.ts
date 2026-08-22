// Native decode helpers for the PP-OCRv6 pipeline. Both wrap a fused C++ op:
// doing either in TypeScript would mean pulling a whole detector or recognizer
// output across the bridge per call.

import { rnexecutorchJsi } from '../../../native/bridge';
import type { Tensor } from '../../../core/tensor';
import { quadsFromFlat, type Quad } from '../ops/quad';

/**
 * Thresholds for {@link extractDbnetTextQuads}.
 * @category Types
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
 * @category Typescript API
 * @param probabilityMap The `detect` output, shape `[1, 1, H, W]`, post-sigmoid.
 * @param options Decode thresholds.
 * @returns The decoded quads, in detector-input pixel space and arbitrary order.
 */
export function extractDbnetTextQuads(probabilityMap: Tensor, options: DbnetDecodeOptions): Quad[] {
  'worklet';
  const flat = rnexecutorchJsi.cv.extractDbnetTextQuads(probabilityMap, options) as Float32Array;
  return quadsFromFlat(flat);
}

/**
 * Takes the per-timestep argmax of the recognizer's `[1, T, V]` probability
 * tensor, together with the probability at that argmax. Blank collapsing and
 * repeat removal stay in TypeScript, so a custom decode can reuse this and apply
 * its own rules.
 * @category Typescript API
 * @param probs Softmaxed recognizer output, shape `[1, T, V]`.
 * @returns A flat `Float32Array`, 2 numbers per timestep: the argmax index and
 * its probability. Index 0 is the CTC blank.
 */
export function ctcGreedyDecode(probs: Tensor): Float32Array {
  'worklet';
  return rnexecutorchJsi.cv.ctcGreedyDecode(probs) as Float32Array;
}
