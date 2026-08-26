/**
 * Instance segmentation task pipeline with NMS, bounding box scaling, and mask
 * extraction.
 */

import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateSpec, method, f32 } from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';

import type { ImageBuffer } from '../image';
import { createImagePreprocessor, type ImagePreprocessorOptions } from '../utils/imagePreprocessor';
import { threshold } from '../../math';
import { resize, normalize } from '../ops/image';
import {
  decodeBox,
  scaleBox,
  nms,
  restrictToBox,
  type BoundingBox,
  type BoxFormat,
} from '../ops/box';
import { RnExecuTorchError } from '../../../core/error';
import { createResourceScope } from '../../../core/lifetime';

/**
 * Options for configuring an instance segmenter preprocessor, label
 * vocabulary, and threshold parameters.
 * @category CV / Types
 * @typeParam F The format type of the bounding box.
 * @typeParam L The label type.
 */
export type InstanceSegmenterOptions<F extends BoxFormat, L> = Omit<
  ImagePreprocessorOptions,
  'resizeMode'
> & {
  /** Resize mode for input images. Must be `'stretch'`. */
  readonly resizeMode: 'stretch';
  /** Array of class labels matching the model's output vocabulary. */
  readonly labels: readonly L[];
  /** How bounding box coordinates are interpreted {@link BoxFormat}. */
  readonly boxFormat: F;
  /** Default Intersection over Union (IoU) threshold for Non-Maximum Suppression (NMS). */
  readonly defaultIouThreshold: number;
  /** Default probability threshold for mask values. */
  readonly defaultMaskThreshold: number;
  /** Default minimum confidence score threshold for detected instances. */
  readonly defaultConfidenceThreshold: number;
};

/**
 * Model configuration required to instantiate an instance segmenter task runner.
 * @category CV / Types
 * @typeParam F The format type of the bounding box.
 * @typeParam L The label type.
 */
export type InstanceSegmenterModel<F extends BoxFormat, L> = {
  /** Local path or remote URL of the `.pte` model file. */
  readonly modelPath: string;
  /**
   * Image preprocessing, label vocabulary, bounding box format, and default
   * NMS/mask/confidence thresholds.
   * See {@link InstanceSegmenterOptions}.
   */
  readonly modelOpts: InstanceSegmenterOptions<F, L>;
};

/**
 * Optional configuration parameters for instance segmentation inference.
 * @category CV / Types
 */
export type SegmentInstancesOptions = {
  /**
   * Minimum confidence threshold. If omitted, uses
   * {@link InstanceSegmenterOptions.defaultConfidenceThreshold}.
   */
  readonly confidenceThreshold?: number;
  /**
   * Intersection over Union (IoU) threshold in NMS. If omitted, uses
   * {@link InstanceSegmenterOptions.defaultIouThreshold}.
   */
  readonly iouThreshold?: number;
  /**
   * Mask binarization probability threshold. If omitted, uses
   * {@link InstanceSegmenterOptions.defaultMaskThreshold}.
   */
  readonly maskThreshold?: number;
};

/**
 * Result structure representing a single detected instance with its bounding box,
 * segmentation mask, label, and confidence score.
 * @category CV / Types
 * @typeParam F The format type of the bounding box.
 * @typeParam L The label type.
 */
export type InstanceSegmentationResult<F extends BoxFormat, L> = {
  /** Scaled bounding box coordinates matching the input image resolution. */
  readonly box: BoundingBox<F>;
  /** Binary segmentation mask buffer cropped to the instance bounding box. */
  readonly mask: ImageBuffer;
  /** Predicted instance class label. */
  readonly label: L;
  /** Confidence score of the instance detection (between 0.0 and 1.0). */
  readonly confidence: number;
};

/**
 * Instance segmentation task runner.
 * @category CV / Types
 * @typeParam F The format type of the bounding box.
 * @typeParam L The label type.
 */
export type InstanceSegmenter<F extends BoxFormat, L> = {
  /**
   * Releases all allocated native resources.
   */
  readonly dispose: () => void;

  /**
   * Performs asynchronous instance segmentation on the given input image.
   * @param input The input image buffer.
   * @param options Execution override options.
   * See {@link SegmentInstancesOptions}.
   * @returns A promise resolving to a list of detected instances.
   * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if predicted class
   * index is out of bounds, `RESOURCE_BUSY` if the model is in use, or
   * `RESOURCE_DISPOSED` if disposed.
   */
  readonly segmentInstances: (
    input: ImageBuffer,
    options?: SegmentInstancesOptions
  ) => Promise<InstanceSegmentationResult<F, L>[]>;

  /**
   * Synchronous version of {@link segmentInstances} to be executed directly on
   * the caller or worklet thread.
   */
  readonly segmentInstancesWorklet: (
    input: ImageBuffer,
    options?: SegmentInstancesOptions
  ) => InstanceSegmentationResult<F, L>[];
};

/**
 * Creates an instance segmenter runner for executing local Instance
 * Segmentation models.
 *
 * It validates model input/output tensor shapes and types, pre-allocates
 * execution and auxiliary tensors, sets up an image preprocessor, and returns
 * execution and resource management controls.
 * @category CV / Tasks
 * @typeParam F The bounding box format type.
 * @typeParam L The label type.
 * @param config Model configuration containing path and options.
 * See {@link InstanceSegmenterModel}.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to the instantiated {@link InstanceSegmenter} runner.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if model fails to load,
 * or `SCHEMA_MISMATCH` if model schema does not match instance segmentation
 * spec.
 */
export async function createInstanceSegmenter<F extends BoxFormat, L>(
  config: InstanceSegmenterModel<F, L>,
  runtime?: WorkletRuntime
): Promise<InstanceSegmenter<F, L>> {
  const scope = createResourceScope();
  const dispose = scope.dispose;

  try {
    const { modelPath, modelOpts } = config;
    const model = scope.track(await wrapAsync(loadModel, runtime)(modelPath));

    const { variant, dims } = validateSpec(model.schema, {
      batched: method(
        'forward',
        [f32(1, 3, 'H', 'W')],
        [f32('N', 4), f32('N'), f32('N'), f32('N', 'MH', 'MW')]
      ),
      unbatched: method(
        'forward',
        [f32(3, 'H', 'W')],
        [f32('N', 4), f32('N'), f32('N'), f32('N', 'MH', 'MW')]
      ),
    });

    const [N, H, W, maskH, maskW] = dims.constant('N', 'H', 'W', 'MH', 'MW');
    const inpShape = { batched: [1, 3, H, W], unbatched: [3, H, W] }[variant];
    const outShape = { boxes: [N, 4], scores: [N], classes: [N], masks: [N, maskH, maskW] };

    const tensors = [
      tensor('float32', outShape.boxes),
      tensor('float32', outShape.scores),
      tensor('float32', outShape.classes),
      tensor('float32', outShape.masks),
      tensor('float32', [maskH, maskW, 1]),
    ] as const;

    tensors.forEach(scope.track);

    const [tBoxes, tScores, tClasses, tAllMasks, tMask] = tensors;

    const preprocessor = scope.track(createImagePreprocessor(modelOpts, inpShape));

    const segmentInstancesWorklet = (
      input: ImageBuffer,
      options?: { confidenceThreshold?: number; iouThreshold?: number; maskThreshold?: number }
    ): InstanceSegmentationResult<F, L>[] => {
      'worklet';
      const tInput = preprocessor.process(input);
      model.execute('forward', [tInput], [tBoxes, tScores, tClasses, tAllMasks]);

      const iouThreshold = options?.iouThreshold ?? modelOpts.defaultIouThreshold;
      const maskThreshold = options?.maskThreshold ?? modelOpts.defaultMaskThreshold;
      const confidenceThreshold =
        options?.confidenceThreshold ?? modelOpts.defaultConfidenceThreshold;

      const eps = 1e-7;
      const clampedMaskThreshold = Math.max(eps, Math.min(1 - eps, maskThreshold));
      const logitMaskThreshold = Math.log(clampedMaskThreshold / (1 - clampedMaskThreshold));

      const indices = nms(tBoxes, tScores, {
        boxFormat: modelOpts.boxFormat,
        iouThreshold,
        confidenceThreshold,
        nmsType: 'standard',
      });

      const boxes = tBoxes.getData(new Float32Array(tBoxes.numel));
      const scores = tScores.getData(new Float32Array(tScores.numel));
      const classes = tClasses.getData(new Float32Array(tClasses.numel));

      const auxTensors = [
        tensor('float32', [input.height, input.width, 1]),
        tensor('float32', [input.height, input.width, 1]),
        tensor('float32', [input.height, input.width, 1]),
        tensor('uint8', [input.height, input.width, 1]),
      ] as const;

      const [tResize, tThreshold, tCrop, tUint8] = auxTensors;

      const results: InstanceSegmentationResult<F, L>[] = [];

      try {
        for (const idx of indices) {
          const confidence = scores[idx]!;
          const classIdx = Math.round(classes[idx]!);
          const label = modelOpts.labels[classIdx];

          if (label === undefined) {
            throw RnExecuTorchError(
              'INVALID_ARGUMENT',
              `InstanceSegmenter: Predicted class index ${classIdx} is ` +
                `out of bounds for labels array of size ${modelOpts.labels.length}.`
            );
          }

          const a = boxes[idx * 4]!;
          const b = boxes[idx * 4 + 1]!;
          const c = boxes[idx * 4 + 2]!;
          const d = boxes[idx * 4 + 3]!;

          const box = scaleBox(decodeBox([a, b, c, d], modelOpts.boxFormat), {
            from: { width: W, height: H },
            to: { width: input.width, height: input.height },
            resizeMode: 'stretch',
          });

          const maskData = tAllMasks
            .copyTo(tMask, { offset: idx * maskH * maskW, length: maskH * maskW })
            .through(resize, tResize, { mode: 'stretch', interpolation: 'linear' })
            .through(threshold, tThreshold, logitMaskThreshold)
            .through(restrictToBox, tCrop, box)
            .through(normalize, tUint8, { alpha: 255.0 })
            .getData(new Uint8Array(tUint8.numel));

          const mask = {
            data: maskData,
            width: input.width,
            height: input.height,
            format: 'gray' as const,
            layout: 'hwc' as const,
          };

          results.push({ box, mask, confidence, label });
        }
      } finally {
        auxTensors.forEach((t) => t.dispose());
      }

      return results;
    };

    const segmentInstances = wrapAsync(segmentInstancesWorklet, runtime);

    return { segmentInstances, segmentInstancesWorklet, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
