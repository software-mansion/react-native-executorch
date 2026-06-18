import { rnexecutorchJsi } from '../../../native/bridge';
import { type Tensor } from '../../../core/tensor';
import { type ImageFormat } from '../image';

/**
 * Supported color conversion code presets (similar to OpenCV).
 * @category Types
 */
export type ColorConversionCode =
  | 'RGBA2RGB'
  | 'RGBA2BGR'
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
  | 'GRAY2RGBA';

/**
 * Helper lookup map detailing required color conversion codes to transition
 * between formats.
 * @internal
 */
export const FORMAT_CONVERSION: Record<
  ImageFormat,
  Record<ImageFormat, ColorConversionCode | null>
> = {
  rgb: { rgb: null, rgba: 'RGB2RGBA', bgr: 'RGB2BGR', bgra: null },
  bgr: { rgb: 'BGR2RGB', rgba: 'BGR2RGBA', bgr: null, bgra: null },
  rgba: { rgb: 'RGBA2RGB', rgba: null, bgr: 'RGBA2BGR', bgra: null },
  bgra: { rgb: 'BGRA2RGB', rgba: 'BGRA2RGBA', bgr: 'BGRA2BGR', bgra: null },
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
  readonly alpha?: number | number[];
  readonly beta?: number | number[];
};

/**
 * Resizes an image tensor from a source dimension to a destination dimension.
 *
 * Supports various resize modes (`stretch`, `letterbox`, `crop`) and
 * interpolation algorithms (`linear`, `lanczos`, etc.).
 * @category Typescript API
 * @param src The source image tensor.
 * @param dst The pre-allocated destination tensor to write the resized image
 * to.
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
 * @param src The source image tensor.
 * @param dst The pre-allocated destination tensor to write the converted image
 * to.
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
 * @param src The source image tensor in HWC layout.
 * @param dst The pre-allocated destination tensor in CHW layout.
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
 * @param src The source image tensor in CHW layout.
 * @param dst The pre-allocated destination tensor in HWC layout.
 * @returns The destination tensor in HWC layout.
 */
export function toChannelsLast(src: Tensor, dst: Tensor): Tensor {
  'worklet';
  return rnexecutorchJsi.cv.toChannelsLast(src, dst);
}

/**
 * Normalizes pixel values of an image tensor element-wise.
 *
 * Computes: `dst = src * alpha + beta`. Can normalize uniformly or channel-wise
 * using array options.
 * @category Typescript API
 * @param src The source image tensor.
 * @param dst The pre-allocated destination tensor to write the normalized
 * values to.
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
