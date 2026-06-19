import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';

import { softmax } from '../../math';
import type { tImageBuffer } from '../image';
import { createImagePreprocessor, type ImagePreprocessorOptions } from './preprocessing';

/**
 * Options for configuring an image classifier preprocessor and label
 * vocabulary.
 * @category Types
 */
export type ClassifierOptions<L> = ImagePreprocessorOptions & { readonly labels: readonly L[] };

/**
 * Model configuration required to instantiate a classifier task runner.
 * @category Types
 */
export type ClassifierModel<L> = {
  readonly modelPath: string;
  readonly classifierOpts: ClassifierOptions<L>;
};

/**
 * Result structure representing a single classification prediction.
 * @category Types
 */
export type Classification<L> = {
  readonly label: L;
  readonly confidence: number;
};

/**
 * Creates an image classifier runner for executing local Image Classification
 * `.pte` models.
 *
 * It validates the model inputs and outputs against the classification
 * SymbolicTensor requirements, pre-allocates the necessary static execution
 * tensors, sets up an image preprocessor, and registers clean disposal hooks to
 * clear all native memory.
 * @category Typescript API
 * @typeParam L The type representing the classification labels.
 * @param config Classifier task configuration containing path and options.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to an object containing classification and
 * disposal controls.
 */
export async function createClassifier<L>(
  config: ClassifierModel<L>,
  runtime?: WorkletRuntime
): Promise<{
  dispose: () => void;
  classify: (input: ImageBuffer, options?: { topk?: number }) => Promise<Classification<L>[]>;
  classifyWorklet: (input: ImageBuffer, options?: { topk?: number }) => Classification<L>[];
}> {
  const { modelPath, classifierOpts } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  const meta = validateModelSchema(
    model,
    'forward',
    [SymbolicTensor('float32', [1, 3, 'H', 'W'], [3, 'H', 'W'])],
    [SymbolicTensor('float32', [1, 'N'], ['N'])]
  );
  const inpShape = meta.inputTensorMeta[0]!.shape;
  const outShape = meta.outputTensorMeta[0]!.shape;

  const tensors = [
    tensor('float32', outShape), //
    tensor('float32', outShape),
  ] as const;

  const [tLogits, tProbas] = tensors;
  const preprocessor = createImagePreprocessor(classifierOpts, inpShape);

  const dispose = () => {
    preprocessor.dispose();
    tensors.forEach((t) => t.dispose());
    model.dispose();
  };

  const classifyWorklet = (
    input: ImageBuffer,
    options?: { topk?: number }
  ): Classification<L>[] => {
    'worklet';
    const tInput = preprocessor.process(input);
    model.execute('forward', [tInput], [tLogits]);

    const probas = tLogits
      .through(softmax, tProbas) //
      .getData(new Float32Array(tProbas.numel));

    return Array.from(probas)
      .map((confidence, index) => ({ confidence, label: classifierOpts.labels[index]! }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, options?.topk);
  };

  const classify = wrapAsync(classifyWorklet, runtime);

  return { classify, classifyWorklet, dispose };
}
