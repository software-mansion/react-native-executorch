import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateSpec, method, f32 } from '../../../core/schema';
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
  /** Resize mode for preprocessing input images {@link ResizeMode} (excluding `'crop'`). */
  readonly resizeMode: Exclude<ResizeMode, 'crop'>;
  /** Array of class labels matching the model's output vocabulary. */
  readonly labels: readonly L[];
  /** How bounding box coordinates are interpreted {@link BoxFormat}. */
  readonly boxFormat: F;
  /** Default Intersection over Union (IoU) threshold for Non-Maximum Suppression (NMS). */
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
  /**
   * Image preprocessing, label vocabulary, and default
   * NMS/confidence thresholds {@link ObjectDetectorOptions}.
   * Used as fallbacks when per-call overrides are omitted.
   */
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
   * @param options.iouThreshold Intersection over Union (IoU) threshold. If
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

  const { variant, dims } = validateSpec(model.schema, {
    batched: method(
      'forward', // prettier-ignore
      [f32(1, 3, 'H', 'W')],
      [f32('N', 4), f32('N'), f32('N')]
    ),
    unbatched: method(
      'forward', // prettier-ignore
      [f32(3, 'H', 'W')],
      [f32('N', 4), f32('N'), f32('N')]
    ),
  });

  const [N, H, W] = dims.constant('N', 'H', 'W');
  const inpShape = { batched: [1, 3, H, W], unbatched: [3, H, W] }[variant];
  const outShapes = { boxes: [N, 4], scores: [N], classes: [N] };

  const tensors = [
    tensor('float32', outShapes.boxes),
    tensor('float32', outShapes.scores),
    tensor('float32', outShapes.classes),
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
          from: { width: W, height: H },
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
