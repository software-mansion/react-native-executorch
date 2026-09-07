/**
 * Neural style transfer task pipeline with output rendering and colorspace
 * conversion.
 */

import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateSpec, method, f32 } from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';
import { createResourceScope } from '../../../core/lifetime';

import type { ImageBuffer } from '../image';
import { createImagePreprocessor, type ImagePreprocessorOptions } from '../utils/imagePreprocessor';
import {
  toChannelsLast,
  normalize,
  cvtColor,
  resize,
  type InterpolationMethod,
  type NormalizeOptions,
} from '../ops/image';

/**
 * Options for configuring the style transfer preprocessor and postprocessor.
 * @category CV / Types
 */
export type StyleTransferOptions = Omit<ImagePreprocessorOptions, 'resizeMode'> & {
  /** Resize mode for input images. Must be `'stretch'`. */
  readonly resizeMode: 'stretch';
  /** Normalization options for postprocessing output tensors back to uint8 pixel values. */
  readonly outNormalizeOpts: NormalizeOptions;
  /** Interpolation method used when resizing output styled images to input dimensions. */
  readonly outInterpolation: InterpolationMethod;
};

/**
 * Model configuration required to instantiate a style transfer task runner.
 * @category CV / Types
 */
export type StyleTransferModel = {
  /** Local path or remote URL of the `.pte` model file. */
  readonly modelPath: string;
  /**
   * Input preprocessing and output postprocessing (normalization back to uint8,
   * interpolation). `resizeMode` is fixed to `'stretch'`.
   * See {@link StyleTransferOptions}.
   */
  readonly modelOpts: StyleTransferOptions;
};

/**
 * Image style transfer task runner.
 * @category CV / Types
 */
export type StyleTransfer = {
  /**
   * Releases all allocated native resources.
   */
  readonly dispose: () => void;

  /**
   * Performs asynchronous image style transfer on the given input image.
   * @param input The input image buffer.
   * @returns A promise resolving to the styled image buffer.
   * @throws {RnExecuTorchError} With code `RESOURCE_BUSY` if the model is in
   * use, or `RESOURCE_DISPOSED` if disposed.
   */
  readonly transferStyle: (input: ImageBuffer) => Promise<ImageBuffer>;

  /**
   * Synchronous version of {@link transferStyle} to be executed directly on the
   * caller or worklet thread.
   */
  readonly transferStyleWorklet: (input: ImageBuffer) => ImageBuffer;
};

/**
 * Creates an image style transfer runner for executing local style transfer models.
 *
 * It validates the model inputs and outputs requirements, pre-allocates
 * the necessary static execution tensors, sets up an image preprocessor, and
 * registers clean disposal hooks to clear all native memory.
 * @category CV / Tasks
 * @param config Style transfer task configuration containing path and options.
 * See {@link StyleTransferModel}.
 * @param runtime Optional worklet runtime thread on which to run the model execution.
 * @returns A promise resolving to the instantiated {@link StyleTransfer} runner.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if model fails to load,
 * or `SCHEMA_MISMATCH` if model schema does not match style transfer spec.
 */
export async function createStyleTransfer(
  config: StyleTransferModel,
  runtime?: WorkletRuntime
): Promise<StyleTransfer> {
  const scope = createResourceScope();
  const dispose = scope.dispose;

  try {
    const { modelPath, modelOpts } = config;
    const model = scope.track(await wrapAsync(loadModel, runtime)(modelPath));

    const { variant, dims } = validateSpec(model.schema, {
      batched: method(
        'forward', // prettier-ignore
        [f32(1, 3, 'H', 'W')],
        [f32(1, 3, 'H', 'W')]
      ),
      unbatched: method(
        'forward', // prettier-ignore
        [f32(3, 'H', 'W')],
        [f32(3, 'H', 'W')]
      ),
    });

    const [H, W] = dims.constant('H', 'W');
    const inpShape = { batched: [1, 3, H, W], unbatched: [3, H, W] }[variant];
    const outShape = inpShape;

    const tensors = [
      tensor('float32', outShape),
      tensor('float32', [3, H, W]),
      tensor('uint8', [3, H, W]),
      tensor('uint8', [H, W, 3]),
      tensor('uint8', [H, W, 4]),
    ] as const;

    tensors.forEach(scope.track);

    const [tOutput, tReshape, tUint8, tChanLast, tRgba] = tensors;
    const preprocessor = scope.track(createImagePreprocessor(modelOpts, inpShape));

    const transferStyleWorklet = (input: ImageBuffer): ImageBuffer => {
      'worklet';
      const tInput = preprocessor.process(input);
      model.execute('forward', [tInput], [tOutput]);

      const data = new Uint8Array(input.width * input.height * 4);
      const tResize = tensor('uint8', [input.height, input.width, 4]);
      try {
        tOutput
          .copyTo(tReshape)
          .through(normalize, tUint8, modelOpts.outNormalizeOpts)
          .through(toChannelsLast, tChanLast)
          .through(cvtColor, tRgba, 'RGB2RGBA')
          .through(resize, tResize, { mode: 'stretch', interpolation: modelOpts.outInterpolation })
          .getData(data);
      } finally {
        tResize.dispose();
      }

      return { data, width: input.width, height: input.height, format: 'rgba', layout: 'hwc' };
    };

    const transferStyle = wrapAsync(transferStyleWorklet, runtime);

    return { transferStyle, transferStyleWorklet, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
