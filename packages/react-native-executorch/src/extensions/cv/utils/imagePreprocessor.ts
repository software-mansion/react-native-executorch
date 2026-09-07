/**
 * Reusable image preprocessing pipeline for neural network inputs.
 */

import { tensor, type Tensor } from '../../../core/tensor';

import type { ImageBuffer } from '../image';
import {
  type ResizeMode,
  type InterpolationMethod,
  type NormalizeOptions,
  FORMAT_CONVERSION,
  FORMAT_CHANNELS,
  resize,
  cvtColor,
  toChannelsFirst,
  normalize,
} from '../ops/image';
import { RnExecuTorchError } from '../../../core/error';

/**
 * Options for configuring the image preprocessor pipeline.
 * @category CV / Types
 */
export type ImagePreprocessorOptions = {
  /** How the input image is resized to match the model's expected dimensions. */
  readonly resizeMode: ResizeMode;
  /** Algorithm used when resizing (e.g. `'linear'`, `'lanczos'`). */
  readonly interpolation: InterpolationMethod;
  /** Normalization scaling coefficients. */
  readonly normalizeOpts: NormalizeOptions;
  /** Optional background fill value used when letterboxing (padding). */
  readonly padValue?: number;
};

/**
 * Image preprocessor runner for transforming image buffers into model input tensors.
 * @category CV / Types
 */
export type ImagePreprocessor = {
  /**
   * Releases all allocated native resources.
   */
  readonly dispose: () => void;

  /**
   * Preprocesses the input image by resizing, converting color space, changing
   * format layout, and normalizing values, copying the output directly to the
   * pre-allocated output tensor.
   *
   * Note: The returned tensor is managed by the preprocessor; consumers do not
   * need to dispose of it manually.
   * @param input The input image buffer to preprocess.
   * @returns A reference to the output tensor containing preprocessed float32
   * data of shape `[3, H, W]` (or `[1, 3, H, W]`) and data type `float32`.
   */
  readonly process: (input: ImageBuffer) => Tensor;
};

/**
 * Creates a reusable image preprocessor pipeline.
 *
 * Configures a pipeline to resize, color convert, convert layout (HWC to CHW),
 * normalize, and copy raw image buffers into target tensors matching model
 * input shapes. All intermediate scratch tensors are pre-allocated and safely
 * disposed of when calling `dispose()`.
 * @category CV / Functions
 * @param options Normalization scaling coefficients, interpolation algorithms, and
 * resize modes.
 * See {@link ImagePreprocessorOptions}.
 * @param outputShape Expected output shape of the preprocessed model input
 * tensor (must match rank-3 `[3, H, W]` or rank-4 `[1, 3, H, W]`).
 * @returns An instantiated {@link ImagePreprocessor} pipeline.
 * @throws {RnExecuTorchError} With code `SCHEMA_MISMATCH` if `outputShape` does
 * not match rank-3 `[3, H, W]` or rank-4 `[1, 3, H, W]`.
 */
export function createImagePreprocessor(
  options: ImagePreprocessorOptions,
  outputShape: number[]
): ImagePreprocessor {
  'worklet';
  const numRgbChannels = 3;
  const isRank3 = outputShape.length === 3 && outputShape[0] === numRgbChannels;
  const isRank4 = outputShape.length === 4 && outputShape[1] === numRgbChannels;
  if (!isRank3 && !isRank4) {
    throw RnExecuTorchError(
      'SCHEMA_MISMATCH',
      `preprocessor: got shape [${outputShape}], expected [${numRgbChannels}, H, W] or [1, ${numRgbChannels}, H, W]`
    );
  }

  const targetH = outputShape.at(-2)!;
  const targetW = outputShape.at(-1)!;
  const tensors = [
    tensor('uint8', [targetH, targetW, numRgbChannels]),
    tensor('uint8', [numRgbChannels, targetH, targetW]),
    tensor('float32', [numRgbChannels, targetH, targetW]),
    tensor('float32', outputShape),
  ] as const;

  const [tColor, tChanFirst, tNorm, tOutput] = tensors;
  const { resizeMode, interpolation, normalizeOpts, padValue } = options;

  const dispose = () => tensors.forEach((t) => t.dispose());

  const process = (input: ImageBuffer): Tensor => {
    'worklet';
    const { data, width, height, format } = input;
    const numChannels = FORMAT_CHANNELS[format];
    const colorCode = FORMAT_CONVERSION[format].rgb;

    const tInput = tensor('uint8', [height, width, numChannels]);
    const tResize = tensor('uint8', [targetH, targetW, numChannels]);
    try {
      tInput
        .setData(data)
        .through(resize, tResize, {
          mode: resizeMode,
          interpolation: interpolation,
          padValue: padValue,
        })
        .throughIf(colorCode !== null, cvtColor, tColor, colorCode!)
        .through(toChannelsFirst, tChanFirst)
        .through(normalize, tNorm, normalizeOpts)
        .copyTo(tOutput);
    } finally {
      tInput.dispose();
      tResize.dispose();
    }
    return tOutput;
  };

  return { process, dispose };
}
