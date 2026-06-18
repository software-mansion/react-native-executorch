import { tensor, type Tensor } from '../../../core/tensor';
import { matchShape } from '../../../core/modelSchema';

import { type ImageBuffer } from '../image';
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

export type ImagePreprocessorOptions = {
  readonly resizeMode: ResizeMode;
  readonly interpolation: InterpolationMethod;
  readonly alpha: number | number[];
  readonly beta: number | number[];
};

export function createImagePreprocessor(
  opts: ImagePreprocessorOptions,
  outputShape: number[]
): {
  process: (input: ImageBuffer) => Tensor;
  dispose: () => void;
} {
  if (!matchShape(outputShape, [1, 3, 'H', 'W'], [3, 'H', 'W']))
    throw new Error(`preprocessor: got shape [${outputShape}], required [1,3,H,W] or [3,H,W]`);

  const targetH = outputShape.at(-2)!;
  const targetW = outputShape.at(-1)!;
  const tensors = [
    tensor('uint8', [targetH, targetW, 3]),
    tensor('uint8', [3, targetH, targetW]),
    tensor('float32', [3, targetH, targetW]),
    tensor('float32', outputShape),
  ] as const;

  const [tColor, tChanFirst, tNorm, tOutput] = tensors;
  const { resizeMode, interpolation, alpha, beta } = opts;

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
