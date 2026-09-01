/**
 * Object detection task pipeline with integrated preprocessing, NMS, and box
 * scaling.
 */

import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateSpec, method, f32 } from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';

import type { ResizeMode } from '../ops/image';
import type { ImageBuffer } from '../image';
import { createImagePreprocessor, type ImagePreprocessorOptions } from '../utils/imagePreprocessor';
import { nms, scaleBox, decodeBox, type BoundingBox, type BoxFormat } from '../ops/box';
import { RnExecuTorchError } from '../../../core/error';
import { createResourceScope } from '../../../core/lifetime';

/**
 * Options for configuring an object detector preprocessor, label vocabulary,
 * and detection thresholds.
 * @category CV / Types
 */
export type ObjectDetectorOptions<F extends BoxFormat, L> = Omit<
  ImagePreprocessorOptions,
  'resizeMode'
> & {
  /** Resize mode for preprocessing input images (excluding `'crop'`). */
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
 * @category CV / Types
 */
export type ObjectDetectorModel<F extends BoxFormat, L> = {
  /** Local path or remote URL of the `.pte` model file. */
  readonly modelPath: string;
  /**
   * Image preprocessing, label vocabulary, and default NMS/confidence
   * thresholds. Used as fallbacks when per-call overrides are omitted.
   * See {@link ObjectDetectorOptions}.
   */
  readonly modelOpts: ObjectDetectorOptions<F, L>;
};

/**
 * Optional configuration parameters for object detection inference.
 * @category CV / Types
 */
export type DetectObjectsOptions = {
  /**
   * Minimum confidence score threshold. If omitted, uses
   * {@link ObjectDetectorOptions.defaultConfidenceThreshold}.
   */
  readonly confidenceThreshold?: number;
  /**
   * Intersection over Union (IoU) threshold for NMS. If omitted, uses
   * {@link ObjectDetectorOptions.defaultIouThreshold}.
   */
  readonly iouThreshold?: number;
};

/**
 * Result structure representing a single object detection prediction.
 * @category CV / Types
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
 * Object detection task runner.
 * @category CV / Types
 * @typeParam F The bounding box format.
 * @typeParam L The type representing the class labels.
 */
export type ObjectDetector<F extends BoxFormat, L> = {
  /**
   * Releases all allocated native resources.
   */
  readonly dispose: () => void;

  /**
   * Asynchronously performs object detection on the input image.
   * @param input The input image buffer.
   * @param options Configuration options for object detection.
   * See {@link DetectObjectsOptions}.
   * @returns A promise resolving to the list of object detections.
   * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if predicted class
   * index is out of bounds, `RESOURCE_BUSY` if the model is in use, or
   * `RESOURCE_DISPOSED` if disposed.
   */
  readonly detectObjects: (
    input: ImageBuffer,
    options?: DetectObjectsOptions
  ) => Promise<ObjectDetection<F, L>[]>;

  /**
   * Synchronous version of {@link detectObjects} to be executed directly on the
   * caller or worklet thread.
   */
  readonly detectObjectsWorklet: (
    input: ImageBuffer,
    options?: DetectObjectsOptions
  ) => ObjectDetection<F, L>[];
};

/**
 * Creates an object detector runner for executing local Object Detection
 * models.
 *
 * It validates the model inputs and outputs requirements, pre-allocates the
 * necessary static execution tensors (boxes, scores, classes), sets up an image
 * preprocessor, and registers clean disposal hooks to clear all native memory.
 * @category CV / Tasks
 * @typeParam F The bounding box format.
 * @typeParam L The type representing the class labels.
 * @param config Object detector task configuration containing path and options.
 * See {@link ObjectDetectorModel}.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to the instantiated {@link ObjectDetector} runner.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if model fails to load,
 * or `SCHEMA_MISMATCH` if model schema does not match object detection spec.
 */
export async function createObjectDetector<F extends BoxFormat, L>(
  config: ObjectDetectorModel<F, L>,
  runtime?: WorkletRuntime
): Promise<ObjectDetector<F, L>> {
  const scope = createResourceScope();
  const dispose = scope.dispose;

  try {
    const { modelPath, modelOpts } = config;
    const model = scope.track(await wrapAsync(loadModel, runtime)(modelPath));

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
    const outShape = { boxes: [N, 4], scores: [N], classes: [N] };

    const tensors = [
      tensor('float32', outShape.boxes),
      tensor('float32', outShape.scores),
      tensor('float32', outShape.classes),
    ] as const;

    tensors.forEach(scope.track);

    const [tBoxes, tScores, tClasses] = tensors;
    const preprocessor = scope.track(createImagePreprocessor(modelOpts, inpShape));

    const { boxFormat } = modelOpts;

    const detectObjectsWorklet = (
      input: ImageBuffer,
      options?: DetectObjectsOptions
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
          throw RnExecuTorchError(
            'INVALID_ARGUMENT',
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
  } catch (error) {
    dispose();
    throw error;
  }
}
