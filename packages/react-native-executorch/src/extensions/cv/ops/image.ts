/**
 * Low-level image manipulation and transformation operators.
 *
 * Provides native OpenCV-accelerated image operations on tensors, including
 * spatial resizing, color space conversion, channel transposition (HWC/CHW),
 * pixel normalization, and colormap application.
 */

import { rnexecutorchJsi } from '../../../native/bridge';
import type { Tensor } from '../../../core/tensor';
import type { ImageFormat } from '../image';

/**
 * Supported color conversion code presets (similar to OpenCV).
 * @category CV / Types
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
 * @category CV / Types
 */
export type ResizeMode = 'stretch' | 'letterbox' | 'crop';

/**
 * Interpolation algorithms used during image resizing.
 * @category CV / Types
 */
export type InterpolationMethod = 'nearest' | 'area' | 'cubic' | 'lanczos' | 'linear';

/**
 * Configuration options for image resize operations.
 * @category CV / Types
 */
export type ResizeOptions = {
  /** How the image is resized (stretch, letterbox, or crop). */
  readonly mode?: ResizeMode;
  /** Background fill value used when letterboxing (padding). */
  readonly padValue?: number;
  /** Pixel interpolation method. */
  readonly interpolation?: InterpolationMethod;
};

/**
 * Configuration options for image tensor normalization.
 * @category CV / Types
 */
export type NormalizeOptions = {
  /**
   * Multiplicative coefficient applied as `pixel * alpha`. Single value for
   * uniform scaling across all channels, or per-channel array.
   */
  readonly alpha?: number | readonly number[];
  /**
   * Additive offset applied as `pixel * alpha + beta`. Single value or
   * per-channel array.
   */
  readonly beta?: number | readonly number[];
};

/**
 * Resizes an image tensor from a source dimension to a destination dimension.
 *
 * Supports various {@link ResizeMode} and {@link InterpolationMethod} options.
 * @category CV / Functions
 * @param src The source image tensor in HWC layout. Expected shape `[H, W, C]`
 * (channels-last). Supports any numeric data type (e.g. `uint8`, `float32`).
 * @param dst The pre-allocated destination image tensor to write the resized
 * image to. Expected shape `[H', W', C]` in HWC layout (spatial dimensions
 * `[H', W']`, channel count `C` matching `src`) and the same data type as
 * `src`.
 * @param options Configuration options for resizing. When options or any
 * individual properties are omitted, defaults to `'stretch'` mode, `'lanczos'`
 * interpolation, and `0` padding.
 * See {@link ResizeOptions}.
 * @returns The destination image tensor containing the resized image of shape
 * `[H', W', C]` and matching data type.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if tensor shapes,
 * layouts, or data types are invalid, `RESOURCE_BUSY` if a tensor is in use, or
 * `RESOURCE_DISPOSED` if either tensor was disposed.
 */
export function resize(src: Tensor, dst: Tensor, options?: ResizeOptions): Tensor {
  'worklet';
  return rnexecutorchJsi.cv.resize(src, dst, {
    mode: options?.mode ?? 'stretch',
    interpolation: options?.interpolation ?? 'lanczos',
    padValue: options?.padValue ?? 0,
  });
}

/**
 * Converts the color space of an image tensor using a specified color
 * conversion code.
 * @category CV / Functions
 * @param src The source image tensor in HWC layout. Expected shape `[H, W, C]`
 * (channels-last). Supports any numeric data type.
 * @param dst The pre-allocated destination image tensor to write the converted
 * image to. Expected shape `[H, W, C']` in HWC layout (spatial dimensions `[H,
 * W]` and data type matching `src`, with target channel count `C'` determined
 * by `code`).
 * @param code The color conversion code indicating source and target spaces.
 * See {@link ColorConversionCode}.
 * @returns The destination image tensor containing the converted image of shape
 * `[H, W, C']` and matching data type.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if tensor shapes,
 * layouts, or data types are invalid, `RESOURCE_BUSY` if a tensor is in use, or
 * `RESOURCE_DISPOSED` if either tensor was disposed.
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
 * @category CV / Functions
 * @param src The source image tensor in HWC layout. Expected shape `[H, W, C]`
 * (channels-last). Supports any numeric data type.
 * @param dst The pre-allocated destination image tensor in CHW layout. Expected
 * shape `[C, H, W]` (channels-first) and the same data type as `src`.
 * @returns The destination image tensor in CHW layout of shape `[C, H, W]` and
 * matching data type.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if tensor shapes,
 * layouts, or data types are invalid, `RESOURCE_BUSY` if a tensor is in use, or
 * `RESOURCE_DISPOSED` if either tensor was disposed.
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
 * @category CV / Functions
 * @param src The source image tensor in CHW layout. Expected shape `[C, H, W]`
 * (channels-first). Supports any numeric data type.
 * @param dst The pre-allocated destination image tensor in HWC layout. Expected
 * shape `[H, W, C]` (channels-last) and the same data type as `src`.
 * @returns The destination image tensor in HWC layout of shape `[H, W, C]` and
 * matching data type.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if tensor shapes,
 * layouts, or data types are invalid, `RESOURCE_BUSY` if a tensor is in use, or
 * `RESOURCE_DISPOSED` if either tensor was disposed.
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
 * @category CV / Functions
 * @param src The source image tensor in CHW layout. Expected shape `[C, H, W]`
 * (channels-first). Supports any numeric data type (typically `uint8` or
 * `float32`).
 * @param dst The pre-allocated destination image tensor to write normalized
 * values to. Expected shape `[C, H, W]` matching `src`. The computed values are
 * cast to `dst` tensor's target data type (typically `float32` or `uint8`).
 * @param options Normalization scaling coefficients. When options or any
 * individual properties are omitted, defaults to `alpha: 1 / 255.0` and `beta:
 * 0.0`.
 * See {@link NormalizeOptions}.
 * @returns The destination image tensor containing the normalized image of
 * shape `[C, H, W]` and target data type.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if tensor shapes,
 * layouts, or data types are invalid, `RESOURCE_BUSY` if a tensor is in use, or
 * `RESOURCE_DISPOSED` if either tensor was disposed.
 */
export function normalize(src: Tensor, dst: Tensor, options?: NormalizeOptions): Tensor {
  'worklet';
  const defaultNormalizeOptions = {
    alpha: 1 / 255.0,
    beta: 0.0,
  } as const;
  return rnexecutorchJsi.cv.normalize(src, dst, { ...defaultNormalizeOptions, ...options });
}

/**
 * Applies a colormap to a single-channel image tensor, mapping class indices to
 * RGBA colors.
 *
 * This operation iterates over each index/class ID in the source tensor, looks
 * up its corresponding RGBA color in the provided colormap palette, and writes
 * it to the destination tensor.
 * @category CV / Functions
 * @param src The source index/mask image tensor. Expected shape `[H, W, 1]` in
 * HWC layout with data type `int32` containing class indices.
 * @param dst The pre-allocated destination image tensor to write the mapped
 * RGBA values to. Expected shape `[H, W, 4]` in HWC layout with data type
 * `uint8`.
 * @param colormap An array of RGBA color arrays `[R, G, B, A]` corresponding to
 * each class index. The size of this list must cover all class indices present
 * in `src`.
 * @returns The destination image tensor with the applied colormap of shape `[H,
 * W, 4]` and data type `uint8`.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if tensor shapes,
 * layouts, or data types are invalid, `RESOURCE_BUSY` if a tensor is in use, or
 * `RESOURCE_DISPOSED` if either tensor was disposed.
 */
export function applyColormap(
  src: Tensor,
  dst: Tensor,
  colormap: [number, number, number, number][]
): Tensor {
  'worklet';
  return rnexecutorchJsi.cv.applyColormap(src, dst, colormap);
}
