import { tensor, type Tensor } from '../../../core/tensor';
import { matchShape } from '../../../core/modelSchema';

import type { ImageBuffer } from '../image';
import {
  type ResizeMode,
  type InterpolationMethod,
  FORMAT_CONVERSION,
  FORMAT_CHANNELS,
  resize,
  cvtColor,
  toChannelsFirst,
  normalize,
} from '../ops/image';

/**
 * Options for configuring the image preprocessor pipeline.
 * @category Types
 */
export type ImagePreprocessorOptions = {
  readonly resizeMode: ResizeMode;
  readonly interpolation: InterpolationMethod;
  readonly alpha: number | number[];
  readonly beta: number | number[];
  readonly padValue?: number;
};

/**
 * Creates a reusable image preprocessor pipeline.
 *
 * Configures a pipeline to resize, color convert, convert layout (HWC to CHW),
 * normalize, and copy raw image buffers into target tensors matching model
 * input shapes. All intermediate scratch tensors are pre-allocated and safely
 * disposed of when calling `dispose()`.
 * @category Typescript API
 * @param opts Normalization scaling coefficients, interpolation algorithms, and
 * crop/resize modes.
 * @param outputShape Expected output shape of the model input tensor (must
 * match `[1, 3, H, W]` or `[3, H, W]`).
 * @returns An object containing the `process` runner function and a `dispose`
 * method.
 */
export function createImagePreprocessor(
  opts: ImagePreprocessorOptions,
  outputShape: number[]
): {
  /**
   * Preprocesses the input image by resizing, converting color space, changing
   * format layout, and normalizing values, copying the output directly to the
   * pre-allocated output tensor.
   *
   * Note: The returned tensor is managed by the preprocessor; consumers do not
   * need to dispose of it manually.
   * @param input The input image buffer to preprocess.
   * @returns A reference to the output tensor containing preprocessed float32
   * data.
   */
  process: (input: ImageBuffer) => Tensor;
  /**
   * Releases all allocated native resources.
   */
  dispose: () => void;
} {
  const numRgbChannels = 3;
  const expectedShapes = [
    [numRgbChannels, 'H', 'W'],
    [1, numRgbChannels, 'H', 'W'],
  ] as const;

  if (!matchShape(outputShape, ...expectedShapes)) {
    throw new Error(
      `preprocessor: got shape [${outputShape}], required one of: ` +
        `${expectedShapes.map((s) => `[${s.join(',')}]`).join(' | ')}`
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
  const { resizeMode, interpolation, alpha, beta, padValue } = opts;

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
        .through(normalize, tNorm, { alpha, beta })
        .copyTo(tOutput);
    } finally {
      tInput.dispose();
      tResize.dispose();
    }
    return tOutput;
  };

  return { process, dispose };
}
