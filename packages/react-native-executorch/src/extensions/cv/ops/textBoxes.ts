import { rnexecutorchJsi } from '../../../native/bridge';
import type { Tensor } from '../../../core/tensor';
import type { Point } from './points';

/**
 * Detector heatmap postprocessing mode. `'craft'` consumes a half-resolution
 * interleaved `[..,Hd,Wd,2]` (text, affinity) map; `'dbnet'` consumes a
 * full-resolution `[..,H,W]` probability map.
 * @category Types
 */
export type TextBoxMode = 'craft' | 'dbnet';

/**
 * An oriented quadrilateral text region returned by {@link extractTextBoxes},
 * in detector-input pixel space.
 * @category Types
 */
export type Quad = {
  /** Four corner points, ordered TL, TR, BR, BL. */
  readonly points: readonly Point[];
  /** Detector confidence for this region (1 for CRAFT grouped lines). */
  readonly score: number;
  /** Line angle in degrees. */
  readonly angle: number;
};

/**
 * CRAFT-mode options for {@link extractTextBoxes} (region+affinity heatmap).
 * @category Types
 */
export type CraftExtractOptions = {
  readonly mode: 'craft';
  readonly textThreshold: number;
  readonly linkThreshold: number;
  readonly lowTextThreshold: number;
  /**
   * Detector input height — used to restore the half-res boxes. Required (the
   * native op throws without it); the OCR pipeline sets it per run.
   */
  readonly targetHeight: number;
  /**
   * Return one upright box per glyph instead of grouped reading-ordered lines:
   * the affinity map is subtracted (not added) to separate adjacent characters,
   * and no line grouping or de-skew rotation is applied. Used by the second,
   * per-column pass that reads upright stacked text. Defaults to `false`.
   */
  readonly charLevel?: boolean;
};

/**
 * DBNet-mode options for {@link extractTextBoxes} (probability map).
 * @category Types
 */
export type DbnetExtractOptions = {
  readonly mode: 'dbnet';
  readonly binThreshold: number;
  readonly boxThreshold: number;
  readonly unclipRatio: number;
  readonly minBoxSide: number;
  readonly maxCandidates: number;
  /**
   * Whether the probability map needs a sigmoid applied first. Set from the
   * model's export contract (`true` = raw logits, `false` = already probabilities).
   */
  readonly applySigmoid: boolean;
};

/**
 * Options for {@link extractTextBoxes} — a discriminated union on `mode`, so the
 * type system enforces exactly the field set the chosen detector needs.
 * @category Types
 */
export type ExtractTextBoxesOptions = CraftExtractOptions | DbnetExtractOptions;

/**
 * Converts a detector heatmap tensor into oriented text-line quads.
 *
 * Variable-sized output: the native op returns a flat array of 10 doubles per
 * box which this wrapper reshapes into {@link Quad}s.
 * @category Typescript API
 * @param src The detector output tensor (float32). CRAFT: `[..,Hd,Wd,2]`;
 * DBNet: `[..,H,W]`.
 * @param opts Mode and per-mode thresholds.
 * @returns The detected quads in detector-input pixel space.
 */
export function extractTextBoxes(src: Tensor, opts: ExtractTextBoxesOptions): Quad[] {
  'worklet';
  const flat = rnexecutorchJsi.cv.extractTextBoxes(src, opts) as number[];
  const quads: Quad[] = [];
  for (let i = 0; i < flat.length; i += 10) {
    quads.push({
      points: [
        { x: flat[i]!, y: flat[i + 1]! },
        { x: flat[i + 2]!, y: flat[i + 3]! },
        { x: flat[i + 4]!, y: flat[i + 5]! },
        { x: flat[i + 6]!, y: flat[i + 7]! },
      ],
      score: flat[i + 8]!,
      angle: flat[i + 9]!,
    });
  }
  return quads;
}

/**
 * Options for {@link warpQuad}.
 * @category Types
 */
export type WarpQuadOptions = {
  /** Width (px) of the warped content inside the destination canvas. */
  readonly contentWidth: number;
  /** Horizontal placement of the content in the canvas. Default `'left'`. */
  readonly align?: 'left' | 'center';
  /** How the remaining canvas is filled. Default `'constant'`. */
  readonly padMode?: 'constant' | 'cornerMean';
  /** Fill value for `padMode: 'constant'`. Default `0`. */
  readonly padValue?: number;
  /**
   * Exact x (px) to place the content at, overriding `align`. Default `-1`
   * (use `align`). Combined with `clear: false`, lets successive warps compose
   * side-by-side into one canvas (e.g. a glyph strip).
   */
  readonly offsetX?: number;
  /**
   * Wipe the canvas to the pad color before writing. Default `true`. Set `false`
   * to preserve prior content (compose multiple warps into one `dst`).
   */
  readonly clear?: boolean;
};

/**
 * Perspective-crops an oriented quad region of `src` into the pre-allocated
 * recognizer canvas `dst`, folding crop + resize-to-height + bucket-pad.
 * @category Typescript API
 * @param src The source image tensor in HWC uint8 layout. Shape [H,W,C].
 * @param dst The pre-allocated recognizer canvas in HWC uint8 layout, sized
 * `[recH, bucketW, C]`.
 * @param quad Eight numbers `[x0,y0,..,x3,y3]` (TL,TR,BR,BL) in `src` pixels.
 * @param opts Content width, alignment, and padding configuration.
 * @returns The destination tensor `dst`.
 */
export function warpQuad(src: Tensor, dst: Tensor, quad: number[], opts: WarpQuadOptions): Tensor {
  'worklet';
  return rnexecutorchJsi.cv.warpQuad(src, dst, quad, {
    contentWidth: opts.contentWidth,
    align: opts.align ?? 'left',
    padMode: opts.padMode ?? 'constant',
    padValue: opts.padValue ?? 0,
    offsetX: opts.offsetX ?? -1,
    clear: opts.clear ?? true,
  });
}

/**
 * Options for {@link ctcGreedyDecode}.
 * @category Types
 */
export type CtcGreedyDecodeOptions = {
  /**
   * Apply a per-timestep softmax so `values` are probabilities (CRNN logits).
   * Leave `false` for heads that are already softmaxed (SVTR).
   */
  readonly softmax?: boolean;
};

/**
 * Per-timestep argmax + max value over recognizer logits, computed natively on
 * the tensor buffer (avoids copying the whole `[T, V]` tensor into JS).
 * @category Typescript API
 * @param src The recognizer output tensor (float32), shape `[..,T,V]`.
 * @param opts Whether to softmax each timestep before taking the max value.
 * @returns The per-timestep argmax `indices` and (optionally softmaxed) max
 * `values`.
 */
export function ctcGreedyDecode(
  src: Tensor,
  opts?: CtcGreedyDecodeOptions
): { indices: number[]; values: number[] } {
  'worklet';
  const flat = rnexecutorchJsi.cv.ctcGreedyDecode(src, {
    softmax: opts?.softmax ?? false,
  }) as number[];
  const indices: number[] = [];
  const values: number[] = [];
  for (let i = 0; i < flat.length; i += 2) {
    indices.push(flat[i]!);
    values.push(flat[i + 1]!);
  }
  return { indices, values };
}

/**
 * Resamples `src` through a backward sampling field (the `torch.grid_sample`
 * step of a geometric dewarp) into the pre-allocated `dst`, natively via
 * `cv::remap`.
 * @category Typescript API
 * @param src The source image tensor in HWC uint8 layout, shape `[H, W, C]`.
 * @param grid The sampling field tensor (float32), shape `[..,2,gH,gW]`, channel
 * 0 = x and 1 = y, normalized to `[-1, 1]` with `align_corners=true`.
 * @param dst The pre-allocated destination tensor, same shape/dtype as `src`.
 * @returns The destination tensor `dst`.
 */
export function gridSample(src: Tensor, grid: Tensor, dst: Tensor): Tensor {
  'worklet';
  return rnexecutorchJsi.cv.gridSample(src, grid, dst);
}
