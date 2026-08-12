import { rnexecutorchJsi } from '../../../native/bridge';
import { type Tensor } from '../../../core/tensor';

/**
 * Thresholds for {@link extractCraftTextBoxes}.
 * @category Types
 */
export type CraftDecodeOptions = {
  /** Region-score threshold for a pixel to count as text. */
  readonly textThreshold: number;
  /** Affinity-score threshold for linking adjacent glyphs into a line. */
  readonly linkThreshold: number;
  /** Minimum peak region score for a component to survive. */
  readonly lowTextThreshold: number;
  /** Detector input height the heatmap was produced from, in pixels. */
  readonly targetHeight: number;
  /** Emit one box per glyph instead of per linked component. */
  readonly charLevel: boolean;
};

/**
 * Thresholds for {@link extractDbnetTextBoxes}.
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
 * Decodes a CRAFT region+affinity heatmap into oriented text boxes: thresholds
 * the two score maps, links glyphs into components and fits a rotated box to
 * each. Coordinates come back in detector-input pixel space (the heatmap is
 * half-resolution, so they are scaled by two).
 * @category Typescript API
 * @param heatmap The `detect` output, shape `[1, H/2, W/2, 2]` (region, affinity).
 * @param options Decode thresholds and the detector input height.
 * @returns A flat array, 5 numbers per box: `x0, y0, x1, y1, angle`.
 */
export function extractCraftTextBoxes(heatmap: Tensor, options: CraftDecodeOptions): number[] {
  'worklet';
  return rnexecutorchJsi.cv.extractCraftTextBoxes(heatmap, options) as number[];
}

/**
 * Decodes a DBNet probability map into oriented text boxes: binarizes the map,
 * traces contours, scores each candidate by its mean probability and unclips the
 * survivors back to their unshrunk size.
 * @category Typescript API
 * @param probabilityMap The `detect` output, shape `[1, 1, H, W]`, post-sigmoid.
 * @param options Decode thresholds.
 * @returns A flat array, 8 numbers per quad: `x0, y0, x1, y1, x2, y2, x3, y3`.
 */
export function extractDbnetTextBoxes(
  probabilityMap: Tensor,
  options: DbnetDecodeOptions
): number[] {
  'worklet';
  return rnexecutorchJsi.cv.extractDbnetTextBoxes(probabilityMap, options) as number[];
}

/**
 * Takes the per-timestep argmax of a recognizer's `[.., T, V]` probability
 * tensor. Blank collapsing and repeat removal stay in TypeScript, so a custom
 * decode can reuse this and apply its own rules.
 * @category Typescript API
 * @param probs Softmaxed recognizer output, shape `[.., T, V]`.
 * @returns A flat array, 2 numbers per timestep: the argmax index and its
 * probability. Index 0 is the CTC blank.
 */
export function ctcGreedyDecode(probs: Tensor): number[] {
  'worklet';
  return rnexecutorchJsi.cv.ctcGreedyDecode(probs) as number[];
}
