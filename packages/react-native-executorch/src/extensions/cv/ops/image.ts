import { rnexecutorchJsi } from '../../../native/bridge';
import type { Tensor } from '../../../core/tensor';
import type { ImageFormat } from '../image';

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
 * Rotates `src` clockwise by `degCW` degrees (90, 180, or 270) into the
 * pre-allocated `dst`. A 90/270 rotation swaps width and height, so `dst` must be
 * sized with `src`'s height and width transposed.
 * @category Typescript API
 * @param src The source image tensor (HWC).
 * @param dst The destination tensor, pre-sized for the rotation.
 * @param degCW The clockwise rotation in degrees: 90, 180, or 270.
 * @returns The destination tensor `dst`.
 */
export function rotate(src: Tensor, dst: Tensor, degCW: number): Tensor {
  'worklet';
  return rnexecutorchJsi.cv.rotate(src, dst, degCW);
}
