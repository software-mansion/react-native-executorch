import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateSpec, method, f32 } from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';

import type { ImageBuffer } from '../image';
import { createImagePreprocessor, type ImagePreprocessorOptions } from './preprocessing';

/**
 * Model configuration required to instantiate an image embedder task runner.
 * @category Types
 */
export type ImageEmbedderModel = {
  /** Local path or remote URL of the `.pte` model file. */
  readonly modelPath: string;
  /**
   * Image preprocessing (resize, color conversion, normalization)
   * for embedding models {@link ImagePreprocessorOptions}.
   */
  readonly modelOpts: ImagePreprocessorOptions;
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
 * @category Typescript API
 * @param config Image embedder task configuration containing path and options.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to an object containing the embedding and
 * disposal controls.
 */
export async function createImageEmbedder(
  config: ImageEmbedderModel,
  runtime?: WorkletRuntime
): Promise<{
  /**
   * Releases all allocated native resources.
   */
  dispose: () => void;

  /**
   * Asynchronously computes the embedding vector for the given input image.
   * @param input The input image buffer.
   * @returns A promise resolving to the embedding vector.
   */
  embed: (input: ImageBuffer) => Promise<Float32Array>;

  /**
   * Synchronous version of {@link embed} to be executed directly on the
   * caller or worklet thread.
   */
  embedWorklet: (input: ImageBuffer) => Float32Array;
}> {
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
