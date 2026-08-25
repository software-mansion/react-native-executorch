/**
 * Image embedding and visual feature extraction task pipeline.
 */

import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateSpec, method, f32 } from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';

import type { ImageBuffer } from '../image';
import { createImagePreprocessor, type ImagePreprocessorOptions } from '../utils/imagePreprocessor';

/**
 * Model configuration required to instantiate an image embedder task runner.
 * @category CV / Types
 */
export type ImageEmbedderModel = {
  /** Local path or remote URL of the `.pte` model file. */
  readonly modelPath: string;
  /**
   * Image preprocessing (resize, color conversion, normalization) for embedding
   * models.
   * See {@link ImagePreprocessorOptions}.
   */
  readonly modelOpts: ImagePreprocessorOptions;
};

/**
 * Image embedding task runner.
 * @category CV / Types
 */
export type ImageEmbedder = {
  /**
   * Releases all allocated native resources.
   */
  readonly dispose: () => void;

  /**
   * Asynchronously computes the embedding vector for the given input image.
   * @param input The input image buffer.
   * @returns A promise resolving to the embedding vector.
   * @throws {RnExecuTorchError} With code `RESOURCE_BUSY` if the model is in
   * use, or `RESOURCE_DISPOSED` if disposed.
   */
  readonly embed: (input: ImageBuffer) => Promise<Float32Array>;

  /**
   * Synchronous version of {@link embed} to be executed directly on the
   * caller or worklet thread.
   */
  readonly embedWorklet: (input: ImageBuffer) => Float32Array;
};

/**
 * Creates an image embedder for executing local Image Embedding
 * models (e.g. the image encoder of a CLIP model).
 *
 * It validates the model input and output requirements, pre-allocates the
 * static execution tensors, sets up an image preprocessor, and registers clean
 * disposal hooks to clear all native memory. Pooling and normalization (if any)
 * are baked into the exported `.pte`; this runner simply preprocesses the image,
 * runs the forward pass, and returns the raw embedding vector.
 * @category CV / Tasks
 * @param config Image embedder task configuration containing path and options.
 * See {@link ImageEmbedderModel}.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to the instantiated {@link ImageEmbedder} runner.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if model fails to load,
 * or `SCHEMA_MISMATCH` if model schema does not match embedding spec.
 */
export async function createImageEmbedder(
  config: ImageEmbedderModel,
  runtime?: WorkletRuntime
): Promise<ImageEmbedder> {
  const { modelPath, modelOpts } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  const { variant, dims } = validateSpec(model.schema, {
    batched: method(
      'forward', // prettier-ignore
      [f32(1, 3, 'H', 'W')],
      [f32(1, 'D')]
    ),
    unbatched: method(
      'forward', // prettier-ignore
      [f32(3, 'H', 'W')],
      [f32('D')]
    ),
  });

  const [D, H, W] = dims.constant('D', 'H', 'W');
  const inpShape = { batched: [1, 3, H, W], unbatched: [3, H, W] }[variant];
  const outShape = { batched: [1, D], unbatched: [D] }[variant];

  const tensors = [tensor('float32', outShape)] as const;
  const [tEmbedding] = tensors;
  const preprocessor = createImagePreprocessor(modelOpts, inpShape);

  const dispose = () => {
    preprocessor.dispose();
    tensors.forEach((t) => t.dispose());
    model.dispose();
  };

  const embedWorklet = (input: ImageBuffer): Float32Array => {
    'worklet';
    const tInput = preprocessor.process(input);
    model.execute('forward', [tInput], [tEmbedding]);
    return tEmbedding.getData(new Float32Array(tEmbedding.numel));
  };

  const embed = wrapAsync(embedWorklet, runtime);

  return { embed, embedWorklet, dispose };
}
