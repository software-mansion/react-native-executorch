import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';

import type { ResizeMode } from '../ops/image';
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
  /** Resize mode for preprocessing input images (`stretch` or `letterbox`). */
  readonly resizeMode: Exclude<ResizeMode, 'crop'>;
  /** Array of class labels matching the model's output vocabulary. */
  readonly labels: readonly L[];
  /** Bounding box format exported by the model (`xyxy`, `cxcywh`, etc.). */
  readonly boxFormat: F;
  /** Default IoU threshold for Non-Maximum Suppression (NMS). */
  readonly defaultIouThreshold: number;
  /** Default minimum confidence score threshold for detections. */
  readonly defaultConfidenceThreshold: number;
};

/**
 * Model configuration required to instantiate an object detector task runner.
 * @category Types
 */
export type ObjectDetectorModel<F extends BoxFormat, L> = {
  /** Local path or remote URL of the `.pte` model file. */
  readonly modelPath: string;
  /** Object detector preprocessor and threshold options. */
  readonly modelOpts: ObjectDetectorOptions<F, L>;
};

/**
 * Result structure representing a single object detection prediction.
 * @category Types
 */
export type ObjectDetection<F extends BoxFormat, L> = {
  /** Scaled bounding box coordinates matching the input image resolution. */
  readonly box: BoundingBox<F>;
  /** Predicted object class label. */
  readonly label: L;
  /** Confidence score of the detection (between 0.0 and 1.0). */
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
   * @param input The input image buffer.
   * @param options Configuration options for object detection.
   * @param options.confidenceThreshold Minimum confidence score threshold. If
   * omitted, uses `modelOpts.defaultConfidenceThreshold`.
   * @param options.iouThreshold Non-maximum suppression IoU threshold. If
   * omitted, uses `modelOpts.defaultIouThreshold`.
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
  const { modelPath, modelOpts } = config;
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
  const preprocessor = createImagePreprocessor(modelOpts, inpShape);

  const { boxFormat } = modelOpts;

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

    const iouThreshold = options?.iouThreshold ?? modelOpts.defaultIouThreshold;
    const confidenceThreshold =
      options?.confidenceThreshold ?? modelOpts.defaultConfidenceThreshold;

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
      const label = modelOpts.labels[classIdx];

      if (label === undefined) {
        throw new Error(
          `ObjectDetector: Predicted class index ${classIdx} is out of bounds for` +
            `labels array of size ${modelOpts.labels.length}.`
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
          ...modelOpts,
        }),
      });
    }

    return results;
  };

  const detectObjects = wrapAsync(detectObjectsWorklet, runtime);

  return { detectObjects, detectObjectsWorklet, dispose };
}
