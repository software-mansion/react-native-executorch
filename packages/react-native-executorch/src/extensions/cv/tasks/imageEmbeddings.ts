import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';

import type { ImageBuffer } from '../image';
import { createImagePreprocessor, type ImagePreprocessorOptions } from './preprocessing';

/**
 * Model configuration required to instantiate an image embeddings task runner.
 * @category Types
 */
export type ImageEmbeddingsModel = {
  readonly modelPath: string;
  readonly opts: ImagePreprocessorOptions;
};

/**
 * Creates an image embeddings runner for executing local Image Embedding
 * models (e.g. the image encoder of a CLIP model).
 *
 * It validates the model input and output requirements, pre-allocates the
 * static execution tensors, sets up an image preprocessor, and registers clean
 * disposal hooks to clear all native memory. Pooling and normalization (if any)
 * are baked into the exported `.pte`; this runner simply preprocesses the image,
 * runs the forward pass, and returns the raw embedding vector.
 * @category Typescript API
 * @param config Image embeddings task configuration containing path and options.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to an object containing the embedding and
 * disposal controls.
 */
export async function createImageEmbeddings(
  config: ImageEmbeddingsModel,
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
  forward: (input: ImageBuffer) => Promise<Float32Array>;
  /**
   * Synchronous version of {@link forward} to be executed directly on the
   * caller or worklet thread.
   */
  forwardWorklet: (input: ImageBuffer) => Float32Array;
}> {
  const { modelPath, opts } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  const meta = validateModelSchema(
    model,
    'forward',
    [SymbolicTensor('float32', [1, 3, 'H', 'W'], [3, 'H', 'W'])],
    [SymbolicTensor('float32', [1, 'D'], ['D'])]
  );
  const inpShape = meta.inputTensorMeta[0]!.shape;
  const outShape = meta.outputTensorMeta[0]!.shape;

  const tEmbedding = tensor('float32', outShape);
  const preprocessor = createImagePreprocessor(opts, inpShape);

  const dispose = () => {
    preprocessor.dispose();
    tEmbedding.dispose();
    model.dispose();
  };

  const forwardWorklet = (input: ImageBuffer): Float32Array => {
    'worklet';
    const tInput = preprocessor.process(input);
    model.execute('forward', [tInput], [tEmbedding]);
    return tEmbedding.getData(new Float32Array(tEmbedding.numel));
  };

  const forward = wrapAsync(forwardWorklet, runtime);

  return { forward, forwardWorklet, dispose };
}
