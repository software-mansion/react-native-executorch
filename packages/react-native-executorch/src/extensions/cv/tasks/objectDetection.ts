import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';

import type { ImageBuffer } from '../image';
import { createImagePreprocessor, type ImagePreprocessorOptions } from './preprocessing';
import { nms, scaleBox, decodeBox, type BoundingBox, type BoxFormat } from '../ops/boxes';

export type { BoxFormat };

/**
 * Options for configuring an object detector preprocessor, label vocabulary,
 * and detection thresholds.
 * @category Types
 */
export type ObjectDetectorOptions<F extends BoxFormat, L> = Omit<
  ImagePreprocessorOptions,
  'resizeMode'
> & {
  readonly resizeMode: 'stretch';
  readonly labels: readonly L[];
  readonly boxFormat: F;
  readonly defaultIouThreshold: number;
  readonly defaultConfidenceThreshold: number;
};

/**
 * Model configuration required to instantiate an object detector task runner.
 * @category Types
 */
export type ObjectDetectorModel<F extends BoxFormat, L> = {
  readonly modelPath: string;
  readonly opts: ObjectDetectorOptions<F, L>;
};

/**
 * Result structure representing a single object detection prediction.
 * @category Types
 */
export type ObjectDetection<F extends BoxFormat, L> = {
  readonly box: BoundingBox<F>;
  readonly label: L;
  readonly confidence: number;
};

/**
 * Creates an object detector runner for executing local Object Detection
 * models.
 *
 * It validates the model inputs and outputs requirements, pre-allocates the
 * necessary static execution tensors (boxes, scores, classes), sets up an image
 * preprocessor, and registers clean disposal hooks to clear all native memory.
 * @category Typescript API
 * @typeParam F The bounding box format.
 * @typeParam L The type representing the class labels.
 * @param config Object detector task configuration containing path and options.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to an object containing object detection and
 * disposal controls.
 */
export async function createObjectDetector<F extends BoxFormat, L>(
  config: ObjectDetectorModel<F, L>,
  runtime?: WorkletRuntime
): Promise<{
  /**
   * Releases all allocated native resources.
   */
  dispose: () => void;
  /**
   * Performs asynchronous object detection on the given input image.
   * @param input The input image buffer.
   * @param options Configuration options for object detection.
   * @param options.confidenceThreshold Minimum confidence score for returned
   * detections.
   * @param options.iouThreshold Non-maximum suppression IoU threshold.
   * @returns A promise resolving to the list of object detections.
   */
  detectObjects: (
    input: ImageBuffer,
    options?: { confidenceThreshold?: number; iouThreshold?: number }
  ) => Promise<ObjectDetection<F, L>[]>;
  /**
   * Synchronous version of {@link detectObjects} to be executed directly on the
   * caller or worklet thread.
   */
  detectObjectsWorklet: (
    input: ImageBuffer,
    options?: { confidenceThreshold?: number; iouThreshold?: number }
  ) => ObjectDetection<F, L>[];
}> {
  const { modelPath, opts } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  const meta = validateModelSchema(
    model,
    'forward',
    [SymbolicTensor('float32', [1, 3, 'H', 'W'], [3, 'H', 'W'])],
    [
      SymbolicTensor('float32', ['N', 4]),
      SymbolicTensor('float32', ['N']),
      SymbolicTensor('float32', ['N']),
    ]
  );

  const inpShape = meta.inputTensorMeta[0]!.shape;
  const outBoxesShape = meta.outputTensorMeta[0]!.shape;
  const outScoresShape = meta.outputTensorMeta[1]!.shape;
  const outClassesShape = meta.outputTensorMeta[2]!.shape;

  const targetH = inpShape.at(-2)!;
  const targetW = inpShape.at(-1)!;

  const tensors = [
    tensor('float32', outBoxesShape),
    tensor('float32', outScoresShape),
    tensor('float32', outClassesShape),
  ] as const;

  const [tBoxes, tScores, tClasses] = tensors;
  const preprocessor = createImagePreprocessor(opts, inpShape);

  const { boxFormat } = opts;

  const dispose = () => {
    preprocessor.dispose();
    tensors.forEach((t) => t.dispose());
    model.dispose();
  };

  const detectObjectsWorklet = (
    input: ImageBuffer,
    options?: { confidenceThreshold?: number; iouThreshold?: number }
  ): ObjectDetection<F, L>[] => {
    'worklet';
    const tInput = preprocessor.process(input);
    model.execute('forward', [tInput], [tBoxes, tScores, tClasses]);

    const boxes = tBoxes.getData(new Float32Array(tBoxes.numel));
    const scores = tScores.getData(new Float32Array(tScores.numel));
    const classes = tClasses.getData(new Float32Array(tClasses.numel));

    const iouThreshold = options?.iouThreshold ?? opts.defaultIouThreshold;
    const confidenceThreshold = options?.confidenceThreshold ?? opts.defaultConfidenceThreshold;

    const results: ObjectDetection<F, L>[] = [];
    const indices = nms(tBoxes, tScores, {
      boxFormat,
      iouThreshold,
      confidenceThreshold,
      nmsType: 'standard',
    });

    for (const index of indices) {
      const confidence = scores[index]!;
      const classIdx = Math.round(classes[index]!);
      const label = opts.labels[classIdx];

      if (label === undefined) {
        throw new Error(
          `ObjectDetector: Predicted class index ${classIdx} is out of bounds for` +
            `labels array of size ${opts.labels.length}.`
        );
      }

      const a = boxes[index * 4]!;
      const b = boxes[index * 4 + 1]!;
      const c = boxes[index * 4 + 2]!;
      const d = boxes[index * 4 + 3]!;

      results.push({
        label,
        confidence,
        box: scaleBox(decodeBox([a, b, c, d], boxFormat), {
          from: { width: targetW, height: targetH },
          to: { width: input.width, height: input.height },
          ...opts,
        }),
      });
    }

    return results;
  };

  const detectObjects = wrapAsync(detectObjectsWorklet, runtime);

  return { detectObjects, detectObjectsWorklet, dispose };
}
