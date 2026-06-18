import { rnexecutorchJsi } from '../../../native/bridge';
import { type Tensor } from '../../../core/tensor';
import { type ImageFormat } from '../image';

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

export const FORMAT_CONVERSION: Record<
  ImageFormat,
  Record<ImageFormat, ColorConversionCode | null>
> = {
  rgb: { rgb: null, rgba: 'RGB2RGBA', bgr: 'RGB2BGR', bgra: null },
  bgr: { rgb: 'BGR2RGB', rgba: 'BGR2RGBA', bgr: null, bgra: null },
  rgba: { rgb: 'RGBA2RGB', rgba: null, bgr: 'RGBA2BGR', bgra: null },
  bgra: { rgb: 'BGRA2RGB', rgba: 'BGRA2RGBA', bgr: 'BGRA2BGR', bgra: null },
};

export const FORMAT_CHANNELS: Record<ImageFormat, number> = {
  rgb: 3,
  bgr: 3,
  rgba: 4,
  bgra: 4,
};

export type ResizeMode = 'stretch' | 'letterbox' | 'crop';
export type InterpolationMethod = 'nearest' | 'area' | 'cubic' | 'lanczos' | 'linear';

export type ResizeOptions = {
  readonly mode?: ResizeMode;
  readonly padValue?: number;
  readonly interpolation?: InterpolationMethod;
};

export type NormalizeOptions = {
  readonly alpha?: number | number[];
  readonly beta?: number | number[];
};

export function resize(src: Tensor, dst: Tensor, opts?: ResizeOptions): Tensor {
  'worklet';
  const defaultResizeOptions = {
    mode: 'stretch',
    interpolation: 'lanczos',
    padValue: 0,
  } as const;
  return rnexecutorchJsi.cv.resize(src, dst, { ...defaultResizeOptions, ...opts });
}

export function cvtColor(src: Tensor, dst: Tensor, code: ColorConversionCode): Tensor {
  'worklet';
  return rnexecutorchJsi.cv.cvtColor(src, dst, code);
}

export function toChannelsFirst(src: Tensor, dst: Tensor): Tensor {
  'worklet';
  return rnexecutorchJsi.cv.toChannelsFirst(src, dst);
}

export function toChannelsLast(src: Tensor, dst: Tensor): Tensor {
  'worklet';
  return rnexecutorchJsi.cv.toChannelsLast(src, dst);
}

export function normalize(src: Tensor, dst: Tensor, opts?: NormalizeOptions): Tensor {
  'worklet';
  const defaultNormalizeOptions = {
    alpha: 1 / 255.0,
    beta: 0.0,
  } as const;
  return rnexecutorchJsi.cv.normalize(src, dst, { ...defaultNormalizeOptions, ...opts });
}
