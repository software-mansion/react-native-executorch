/**
 * Depth estimation task pipeline with image preprocessing and floating-point
 * depth map resizing.
 */
import type { WorkletRuntime } from 'react-native-worklets';

import { createResourceScope } from '../../../core/lifetime';
import { loadModel } from '../../../core/model';
import { wrapAsync } from '../../../core/runtime';
import { validateSpec, method, f32 } from '../../../core/schema';
import { tensor } from '../../../core/tensor';
import type { ImageBuffer } from '../image';
import { resize, type InterpolationMethod } from '../ops/image';
import { createImagePreprocessor, type ImagePreprocessorOptions } from '../utils/imagePreprocessor';

/**
 * Result structure representing the output of a depth estimation task.
 * @category CV / Types
 */
export type DepthMap = {
  /**
   * Raw model values, indexed as `data[y * width + x]`. Each result owns its
   * buffer. Values are not normalized or converted to display pixels.
   * Interpretation and units depend on the loaded model.
   */
  readonly data: Float32Array;
  /** Width of the depth map in pixels. */
  readonly width: number;
  /** Height of the depth map in pixels. */
  readonly height: number;
};

/**
 * Options for configuring a depth estimator preprocessor and output
 * interpolation.
 * @category CV / Types
 */
export type DepthEstimatorOptions = Omit<ImagePreprocessorOptions, 'resizeMode' | 'padValue'> & {
  /** Resize mode for input images. Must be `'stretch'`. */
  readonly resizeMode: 'stretch';
  /** Interpolation method used when resizing depth maps back to input image dimensions. */
  readonly outInterpolation: InterpolationMethod;
};

/**
 * Model configuration required to instantiate a depth estimator task runner.
 * @category CV / Types
 */
export type DepthEstimatorModel = {
  /** Local path or remote URL of the `.pte` model file. */
  readonly modelPath: string;
  /**
   * Input preprocessing and output depth map interpolation. `resizeMode` is
   * fixed to `'stretch'`. See {@link DepthEstimatorOptions}.
   */
  readonly modelOpts: DepthEstimatorOptions;
};

/**
 * Depth estimation task runner.
 * @category CV / Types
 */
export type DepthEstimator = {
  /**
   * Releases all allocated native resources.
   */
  readonly dispose: () => void;

  /**
   * Asynchronously performs depth estimation on the input image.
   *
   * The full input image is stretched to the model's input size, and the
   * floating-point depth map is resized back to the input image dimensions.
   * Depth values retain the model's original scale.
   * @param input The input image buffer.
   * @returns A promise resolving to the depth map at the input image resolution.
   * @throws {RnExecuTorchError} With code `RESOURCE_BUSY` if the model is in
   * use, or `RESOURCE_DISPOSED` if disposed.
   */
  readonly estimateDepth: (input: ImageBuffer) => Promise<DepthMap>;

  /**
   * Synchronous version of {@link estimateDepth} to be executed directly on the
   * caller or worklet thread.
   */
  readonly estimateDepthWorklet: (input: ImageBuffer) => DepthMap;
};

/**
 * Creates a depth estimator runner for executing local depth estimation models.
 *
 * It validates the model inputs and outputs requirements, pre-allocates the
 * necessary static execution tensors, sets up an image preprocessor, and
 * registers clean disposal hooks to clear all native memory.
 *
 * Accepts batched or unbatched CHW RGB inputs and matching depth outputs.
 * Output spatial dimensions may differ from the input tensor. Preprocessing
 * and output interpolation follow `modelOpts`; depth values retain the model's
 * original scale.
 * @category CV / Tasks
 * @param config Depth estimator task configuration containing path and options.
 * See {@link DepthEstimatorModel}.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to the instantiated {@link DepthEstimator} runner.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if model fails to load,
 * or `SCHEMA_MISMATCH` if model schema does not match depth estimation spec.
 */
export async function createDepthEstimator(
  config: DepthEstimatorModel,
  runtime?: WorkletRuntime
): Promise<DepthEstimator> {
  const scope = createResourceScope();
  const dispose = scope.dispose;

  try {
    const { modelPath, modelOpts } = config;
    const model = scope.track(await wrapAsync(loadModel, runtime)(modelPath));

    const { variant, dims } = validateSpec(model.schema, {
      batched: method(
        'forward', // prettier-ignore
        [f32(1, 3, 'H', 'W')],
        [f32(1, 'OH', 'OW')]
      ),
      unbatched: method(
        'forward', // prettier-ignore
        [f32(3, 'H', 'W')],
        [f32('OH', 'OW')]
      ),
    });

    const [H, W, OH, OW] = dims.constant('H', 'W', 'OH', 'OW');
    const inpShape = { batched: [1, 3, H, W], unbatched: [3, H, W] }[variant];
    const outShape = { batched: [1, OH, OW], unbatched: [OH, OW] }[variant];

    const tensors = [
      scope.track(tensor('float32', outShape)),
      scope.track(tensor('float32', [OH, OW, 1])),
    ] as const;

    const [tOutput, tDepth] = tensors;
    const preprocessor = scope.track(createImagePreprocessor(modelOpts, inpShape));

    const estimateDepthWorklet = (input: ImageBuffer): DepthMap => {
      'worklet';
      const tInput = preprocessor.process(input);
      model.execute('forward', [tInput], [tOutput]);

      const tResize = tensor('float32', [input.height, input.width, 1]);
      try {
        const data = tOutput
          .copyTo(tDepth)
          .through(resize, tResize, { mode: 'stretch', interpolation: modelOpts.outInterpolation })
          .getData(new Float32Array(input.width * input.height));

        return { data, width: input.width, height: input.height };
      } finally {
        tResize.dispose();
      }
    };

    const estimateDepth = wrapAsync(estimateDepthWorklet, runtime);

    return {
      dispose,
      estimateDepth,
      estimateDepthWorklet,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
