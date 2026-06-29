import { rnexecutorchJsi } from '../../../native/bridge';
import type { Tensor } from '../../../core/tensor';
import type { ImageFormat } from '../image';
import type { Point } from './points';

/**
 * Supported color conversion code presets (similar to OpenCV).
 * @category Types
 */
export type ColorConversionCode =
  | 'RGBA2RGB'
  | 'RGBA2BGR'
  | 'RGBA2BGRA'
  | 'BGRA2RGBA'
  | 'BGRA2RGB'
  | 'BGRA2BGR'
  | 'RGB2BGR'
  | 'BGR2RGB'
  | 'RGB2GRAY'
  | 'RGBA2GRAY'
  | 'BGR2GRAY'
  | 'BGRA2GRAY'
  | 'RGB2RGBA'
  | 'BGR2RGBA'
  | 'RGB2BGRA'
  | 'BGR2BGRA'
  | 'GRAY2RGBA'
  | 'GRAY2RGB'
  | 'GRAY2BGR'
  | 'GRAY2BGRA';

/**
 * Helper lookup map detailing required color conversion codes to transition
 * between formats.
 * @internal
 */
export const FORMAT_CONVERSION: Record<
  ImageFormat,
  Record<ImageFormat, ColorConversionCode | null>
> = {
  rgb: { rgb: null, rgba: 'RGB2RGBA', bgr: 'RGB2BGR', bgra: 'RGB2BGRA', gray: 'RGB2GRAY' },
  bgr: { rgb: 'BGR2RGB', rgba: 'BGR2RGBA', bgr: null, bgra: 'BGR2BGRA', gray: 'BGR2GRAY' },
  rgba: { rgb: 'RGBA2RGB', rgba: null, bgr: 'RGBA2BGR', bgra: 'RGBA2BGRA', gray: 'RGBA2GRAY' },
  bgra: { rgb: 'BGRA2RGB', rgba: 'BGRA2RGBA', bgr: 'BGRA2BGR', bgra: null, gray: 'BGRA2GRAY' },
  gray: { rgb: 'GRAY2RGB', rgba: 'GRAY2RGBA', bgr: 'GRAY2BGR', bgra: 'GRAY2BGRA', gray: null },
};

/**
 * Helper lookup mapping each pixel format to its respective number of color
 * channels.
 * @internal
 */
export const FORMAT_CHANNELS: Record<ImageFormat, number> = {
  rgb: 3,
  bgr: 3,
  rgba: 4,
  bgra: 4,
  gray: 1,
};

/**
 * Modes for resizing an image tensor to match target dimensions.
 * @category Types
 */
export type ResizeMode = 'stretch' | 'letterbox' | 'crop';

/**
 * Interpolation algorithms used during image resizing.
 * @category Types
 */
export type InterpolationMethod = 'nearest' | 'area' | 'cubic' | 'lanczos' | 'linear';

/**
 * Configuration options for image resize operations.
 * @category Types
 */
export type ResizeOptions = {
  readonly mode?: ResizeMode;
  readonly padValue?: number;
  readonly interpolation?: InterpolationMethod;
};

/**
 * Configuration options for image tensor normalization.
 * @category Types
 */
export type NormalizeOptions = {
  readonly alpha?: number | readonly number[];
  readonly beta?: number | readonly number[];
};

/**
 * Resizes an image tensor from a source dimension to a destination dimension.
 *
 * Supports various resize modes (`stretch`, `letterbox`, `crop`) and
 * interpolation algorithms (`linear`, `lanczos`, etc.).
 * @category Typescript API
 * @param src The source image tensor in HWC layout. Shape [H,W,C].
 * @param dst The pre-allocated destination tensor to write the resized image
 * to. `dst` must be in HWC layout and its number of channels must match `src`.
 * Shape [H',W',C].
 * @param opts Configuration options for resizing.
 * @returns The destination tensor containing the resized image.
 */
export function resize(src: Tensor, dst: Tensor, opts?: ResizeOptions): Tensor {
  'worklet';
  return rnexecutorchJsi.cv.resize(src, dst, {
    mode: opts?.mode ?? 'stretch',
    interpolation: opts?.interpolation ?? 'lanczos',
    padValue: opts?.padValue ?? 0,
  });
}

/**
 * Converts the color space of an image tensor using a specified color
 * conversion code.
 * @category Typescript API
 * @param src The source image tensor in HWC layout. Shape [H,W,C].
 * @param dst The pre-allocated destination tensor to write the converted image
 * to. `dst` must be in HWC layout and its spatial dimensions [H,W] as well as
 * dtype must match `src`. Shape [H,W,C'].
 * @param code The color conversion code indicating source and target spaces
 * (e.g. 'RGBA2RGB').
 * @returns The destination tensor containing the converted image.
 */
export function cvtColor(src: Tensor, dst: Tensor, code: ColorConversionCode): Tensor {
  'worklet';
  return rnexecutorchJsi.cv.cvtColor(src, dst, code);
}

/**
 * Transposes an image tensor layout from HWC (Height, Width, Channel) to CHW
 * (Channel, Height, Width).
 *
 * Commonly required for PyTorch Edge models which expect channels-first inputs.
 * @category Typescript API
 * @param src The source image tensor in HWC layout. Shape [H,W,C].
 * @param dst The pre-allocated destination tensor in CHW layout. `dst` tensor's
 * spatial dimensions [H,W], number of channels and dtype must match `src`.
 * Shape [C,H,W].
 * @returns The destination tensor in CHW layout.
 */
export function toChannelsFirst(src: Tensor, dst: Tensor): Tensor {
  'worklet';
  return rnexecutorchJsi.cv.toChannelsFirst(src, dst);
}

/**
 * Transposes an image tensor layout from CHW (Channel, Height, Width) to HWC
 * (Height, Width, Channel).
 *
 * Useful for post-processing model outputs back into channels-last layouts for
 * rendering or display.
 * @category Typescript API
 * @param src The source image tensor in CHW layout. Shape [C,H,W].
 * @param dst The pre-allocated destination tensor in HWC layout. `dst` tensor's
 * spatial dimensions [H,W], number of channels and dtype must match `src`.
 * Shape [H,W,C].
 * @returns The destination tensor in HWC layout.
 */
export function toChannelsLast(src: Tensor, dst: Tensor): Tensor {
  'worklet';
  return rnexecutorchJsi.cv.toChannelsLast(src, dst);
}

/**
 * Normalizes pixel values of an image tensor element-wise.
 *
 * Computes: `dst[c,h,w] = src[c,h,w] * alpha[c] + beta[c]`. Can normalize
 * uniformly or channel-wise using array options. The result is cast to `dst`
 * tensor's dtype.
 * @category Typescript API
 * @param src The source image tensor in CHW layout. Shape [C,H,W].
 * @param dst The pre-allocated destination tensor to write the normalized
 * values to. `dst` must have the same shape as `src`. Shape [C,H,W].
 * @param opts Normalization scaling coefficients.
 * @returns The destination tensor containing the normalized image.
 */
export function normalize(src: Tensor, dst: Tensor, opts?: NormalizeOptions): Tensor {
  'worklet';
  const defaultNormalizeOptions = {
    alpha: 1 / 255.0,
    beta: 0.0,
  } as const;
  return rnexecutorchJsi.cv.normalize(src, dst, { ...defaultNormalizeOptions, ...opts });
}

/**
 * Applies a colormap to a single-channel image tensor, mapping class indices to
 * RGBA colors.
 *
 * This operation iterates over each index/class ID in the source tensor, looks
 * up its corresponding RGBA color in the provided colormap palette, and writes
 * it to the destination tensor.
 * @category Typescript API
 * @param src The source index/mask tensor. Must be an integer tensor of `int32`
 * dtype containing class indices. Shape `[H, W, 1]` (or `[H, W]`).
 * @param dst The pre-allocated destination tensor to write the mapped RGBA
 * values to. Must be a 3D image tensor in HWC layout and `uint8` dtype. Shape
 * `[H, W, 4]`.
 * @param colormap An array of RGBA color arrays `[R, G, B, A]` corresponding to each
 * class index. The size of this list must cover all class indices present in `src`.
 * @returns The destination tensor with the applied colormap.
 */
export function applyColormap(
  src: Tensor,
  dst: Tensor,
  colormap: [number, number, number, number][]
): Tensor {
  'worklet';
  return rnexecutorchJsi.cv.applyColormap(src, dst, colormap);
}

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
  // Defaults live here (the native op requires every field) — see add-native-extension.
  return rnexecutorchJsi.cv.warpQuad(src, dst, quad, {
    contentWidth: opts.contentWidth,
    align: opts.align ?? 'left',
    padMode: opts.padMode ?? 'constant',
    padValue: opts.padValue ?? 0,
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
