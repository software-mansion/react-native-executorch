import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateSpec, method, f32 } from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';

import { softmax } from '../../math';
import type { ImageBuffer } from '../image';
import { createImagePreprocessor, type ImagePreprocessorOptions } from './preprocessing';
import { RnExecutorchError, RnExecutorchErrorCode, rnExecutorchError } from '../../../errors';

/**
 * Options for configuring an image classifier preprocessor and label
 * vocabulary.
 * @category Types
 */
export type ClassifierOptions<L> = ImagePreprocessorOptions & {
  /** Array of class labels matching the model's output vocabulary. */
  readonly labels: readonly L[];
};

/**
 * Model configuration required to instantiate a classifier task runner.
 * @category Types
 */
export type ClassifierModel<L> = {
  /** Local path or remote URL of the `.pte` model file. */
  readonly modelPath: string;
  /**
   * Image preprocessing and label vocabulary
   * {@link ClassifierOptions}. The `labels` array length must
   * match the model's output dimension.
   */
  readonly modelOpts: ClassifierOptions<L>;
};

/**
 * Result structure representing a single classification prediction.
 * @category Types
 */
export type Classification<L> = {
  /** Predicted class label. */
  readonly label: L;
  /** Confidence score of the prediction (between 0.0 and 1.0). */
  readonly confidence: number;
};

/**
 * Creates an image classifier runner for executing local Image Classification
 * models.
 *
 * It validates the model inputs and outputs requirements, asserts that the
 * labels array length matches the model's output vocabulary size, pre-allocates
 * the necessary static execution tensors, sets up an image preprocessor, and
 * registers clean disposal hooks to clear all native memory.
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
  /**
   * Releases all allocated native resources.
   */
  dispose: () => void;

  /**
   * Performs asynchronous image classification on the given input image.
   * @param input The input image buffer.
   * @param options Configuration options for classification.
   * @param options.topk The number of top-scoring classification results to
   * return. If omitted, all classes are returned. Must be non-negative.
   * @returns A promise resolving to the list of classifications sorted by
   * confidence.
   */
  classify: (input: ImageBuffer, options?: { topk?: number }) => Promise<Classification<L>[]>;

  /**
   * Synchronous version of {@link classify} to be executed directly on the
   * caller or worklet thread.
   */
  classifyWorklet: (input: ImageBuffer, options?: { topk?: number }) => Classification<L>[];
}> {
  const { modelPath, modelOpts } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  const { variant, dims } = validateSpec(model.schema, {
    batched: method(
      'forward', // prettier-ignore
      [f32(1, 3, 'H', 'W')],
      [f32(1, 'N')]
    ),
    unbatched: method(
      'forward', // prettier-ignore
      [f32(3, 'H', 'W')],
      [f32('N')]
    ),
  });

  const [N, H, W] = dims.constant('N', 'H', 'W');
  const inpShape = { batched: [1, 3, H, W], unbatched: [3, H, W] }[variant];
  const outShape = { batched: [1, N], unbatched: [N] }[variant];

  if (modelOpts.labels.length !== N) {
    throw new RnExecutorchError(
      RnExecutorchErrorCode.InvalidArgument,
      `Classifier labels length (${modelOpts.labels.length}) must match model output dimension (${N}).`
    );
  }

  const tensors = [
    tensor('float32', outShape), // prettier-ignore
    tensor('float32', outShape),
  ] as const;

  const [tLogits, tProbas] = tensors;
  const preprocessor = createImagePreprocessor(modelOpts, inpShape);

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
    if (options?.topk !== undefined && options.topk < 0) {
      throw rnExecutorchError(
        RnExecutorchErrorCode.InvalidArgument,
        `Classifier topk option must be non-negative, got ${options.topk}`
      );
    }
    const tInput = preprocessor.process(input);
    model.execute('forward', [tInput], [tLogits]);

    const probas = tLogits
      .through(softmax, tProbas) // prettier-ignore
      .getData(new Float32Array(tProbas.numel));

    return Array.from(probas)
      .map((confidence, index) => ({ confidence, label: modelOpts.labels[index]! }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, options?.topk);
  };

  const classify = wrapAsync(classifyWorklet, runtime);

  return { classify, classifyWorklet, dispose };
}
