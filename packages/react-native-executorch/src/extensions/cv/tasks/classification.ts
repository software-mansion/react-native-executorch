/**
 * Image classification task pipeline with integrated preprocessing and softmax
 * decoding.
 */

import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateSpec, method, f32 } from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';

import { softmax } from '../../math';
import type { ImageBuffer } from '../image';
import { createImagePreprocessor, type ImagePreprocessorOptions } from './preprocessing';
import { RnExecuTorchError } from '../../../core/error';

/**
 * Options for configuring an image classifier preprocessor and label
 * vocabulary.
 * @category CV / Types
 */
export type ClassifierOptions<L> = ImagePreprocessorOptions & {
  /** Array of class labels matching the model's output vocabulary. */
  readonly labels: readonly L[];
};

/**
 * Model configuration required to instantiate a classifier task runner.
 * @category CV / Types
 */
export type ClassifierModel<L> = {
  /** Local path or remote URL of the `.pte` model file. */
  readonly modelPath: string;
  /**
   * Image preprocessing and label vocabulary. The `labels` array length must
   * match the model's output dimension.
   * See {@link ClassifierOptions}.
   */
  readonly modelOpts: ClassifierOptions<L>;
};

/**
 * Optional configuration parameters for classification inference.
 * @category CV / Types
 */
export type ClassifyOptions = {
  /**
   * Number of top-scoring classification results to return. If omitted, all
   * classes are returned.
   */
  readonly topk?: number;
};

/**
 * Result structure representing a single classification prediction.
 * @category CV / Types
 */
export type Classification<L> = {
  /** Predicted class label. */
  readonly label: L;
  /** Confidence score of the prediction (between 0.0 and 1.0). */
  readonly confidence: number;
};

/**
 * Image classification task runner.
 * @category CV / Types
 * @typeParam L The type representing the classification labels.
 */
export type Classifier<L> = {
  /**
   * Releases all allocated native resources.
   */
  readonly dispose: () => void;

  /**
   * Performs asynchronous image classification on the given input image.
   * @param input The input image buffer.
   * @param options Configuration options for classification.
   * See {@link ClassifyOptions}.
   * @returns A promise resolving to the list of classifications sorted by
   * confidence.
   * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if `topk` is
   * negative, `RESOURCE_BUSY` if the model is in use, or
   * `RESOURCE_DISPOSED` if disposed.
   */
  readonly classify: (
    input: ImageBuffer,
    options?: ClassifyOptions
  ) => Promise<Classification<L>[]>;

  /**
   * Synchronous version of {@link classify} to be executed directly on the
   * caller or worklet thread.
   */
  readonly classifyWorklet: (input: ImageBuffer, options?: ClassifyOptions) => Classification<L>[];
};

/**
 * Creates an image classifier runner for executing local Image Classification
 * models.
 *
 * It validates the model inputs and outputs requirements, asserts that the
 * labels array length matches the model's output vocabulary size, pre-allocates
 * the necessary static execution tensors, sets up an image preprocessor, and
 * registers clean disposal hooks to clear all native memory.
 * @category CV / Tasks
 * @typeParam L The type representing the classification labels.
 * @param config Classifier task configuration containing path and options.
 * See {@link ClassifierModel}.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to the instantiated {@link Classifier} runner.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if model fails to load,
 * `SCHEMA_MISMATCH` if model schema does not match classification spec, or
 * `INVALID_ARGUMENT` if labels length does not match model output classes.
 */
export async function createClassifier<L>(
  config: ClassifierModel<L>,
  runtime?: WorkletRuntime
): Promise<Classifier<L>> {
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
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
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

  const classifyWorklet = (input: ImageBuffer, options?: ClassifyOptions): Classification<L>[] => {
    'worklet';
    if (options?.topk !== undefined && options.topk < 0) {
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
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
