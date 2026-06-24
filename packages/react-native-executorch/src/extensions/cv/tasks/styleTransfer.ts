import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';

import type { ImageBuffer } from '../image';
import { createImagePreprocessor, type ImagePreprocessorOptions } from './preprocessing';
import {
  toChannelsLast,
  normalize,
  cvtColor,
  resize,
  type InterpolationMethod,
} from '../ops/image';

/**
 * Options for configuring the style transfer preprocessor and postprocessor.
 * @category Types
 */
export type StyleTransferOptions = Omit<ImagePreprocessorOptions, 'resizeMode'> & {
  readonly resizeMode: 'stretch';
  readonly outAlpha: number | number[];
  readonly outBeta: number | number[];
  readonly outInterpolation: InterpolationMethod;
};

/**
 * Model configuration required to instantiate a style transfer task runner.
 * @category Types
 */
export type StyleTransferModel = {
  readonly modelPath: string;
  readonly opts: StyleTransferOptions;
};

/**
 * Creates an image style transfer runner for executing local style transfer models.
 *
 * It validates the model inputs and outputs requirements, pre-allocates
 * the necessary static execution tensors, sets up an image preprocessor, and
 * registers clean disposal hooks to clear all native memory.
 * @category Typescript API
 * @param config Style transfer task configuration containing path and options.
 * @param runtime Optional worklet runtime thread on which to run the model execution.
 * @returns A promise resolving to an object containing style transfer and disposal controls.
 */
export async function createStyleTransfer(
  config: StyleTransferModel,
  runtime?: WorkletRuntime
): Promise<{
  /**
   * Releases all allocated native resources.
   */
  dispose: () => void;
  /**
   * Performs asynchronous image style transfer on the given input image.
   * @param input The input image buffer.
   * @returns A promise resolving to the styled image buffer.
   */
  transferStyle: (input: ImageBuffer) => Promise<ImageBuffer>;
  /**
   * Synchronous version of {@link transferStyle} to be executed directly on the
   * caller or worklet thread.
   */
  transferStyleWorklet: (input: ImageBuffer) => ImageBuffer;
}> {
  const { modelPath, opts } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  const meta = validateModelSchema(
    model,
    'forward',
    [SymbolicTensor('float32', [1, 3, 'H', 'W'], [3, 'H', 'W'])],
    [SymbolicTensor('float32', [1, 3, 'H', 'W'], [3, 'H', 'W'])]
  );
  const inpShape = meta.inputTensorMeta[0]!.shape;
  const outShape = meta.outputTensorMeta[0]!.shape;

  const targetH = outShape.at(-2)!;
  const targetW = outShape.at(-1)!;

  const tensors = [
    tensor('float32', outShape),
    tensor('float32', [3, targetH, targetW]),
    tensor('uint8', [3, targetH, targetW]),
    tensor('uint8', [targetH, targetW, 3]),
    tensor('uint8', [targetH, targetW, 4]),
  ] as const;

  const [tOutput, tReshape, tUint8, tChanLast, tRgba] = tensors;
  const preprocessor = createImagePreprocessor(opts, inpShape);

  const dispose = () => {
    tensors.forEach((t) => t.dispose());
    preprocessor.dispose();
    model.dispose();
  };

  const transferStyleWorklet = (input: ImageBuffer): ImageBuffer => {
    'worklet';
    const tInput = preprocessor.process(input);
    model.execute('forward', [tInput], [tOutput]);

    const data = new Uint8Array(input.width * input.height * 4);
    const tResize = tensor('uint8', [input.height, input.width, 4]);
    try {
      tOutput
        .copyTo(tReshape)
        .through(normalize, tUint8, { alpha: opts.outAlpha, beta: opts.outBeta })
        .through(toChannelsLast, tChanLast)
        .through(cvtColor, tRgba, 'RGB2RGBA')
        .through(resize, tResize, { mode: 'stretch', interpolation: opts.outInterpolation })
        .getData(data);
    } finally {
      tResize.dispose();
    }

    return { data, width: input.width, height: input.height, format: 'rgba', layout: 'hwc' };
  };

  const transferStyle = wrapAsync(transferStyleWorklet, runtime);

  return { transferStyle, transferStyleWorklet, dispose };
}
