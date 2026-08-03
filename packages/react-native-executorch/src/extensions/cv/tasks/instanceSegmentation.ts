import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';

import type { ImageBuffer } from '../image';
import { createImagePreprocessor, type ImagePreprocessorOptions } from './preprocessing';
import { threshold } from '../../math';
import { resize, normalize } from '../ops/image';
import {
  decodeBox,
  scaleBox,
  nms,
  restrictToBox,
  type BoundingBox,
  type BoxFormat,
} from '../ops/boxes';

export type { BoxFormat };

/**
 * Options for configuring an instance segmenter preprocessor, label
 * vocabulary, and threshold parameters.
 * @category Types
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
  /** Bounding box format {@link BoxFormat}. */
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
 * @category Types
 * @typeParam F The format type of the bounding box.
 * @typeParam L The label type.
 */
export type InstanceSegmenterModel<F extends BoxFormat, L> = {
  /** Local path or remote URL of the `.pte` model file. */
  readonly modelPath: string;
  /** Instance segmenter options. */
  readonly modelOpts: InstanceSegmenterOptions<F, L>;
};

/**
 * Result structure representing a single detected instance with its bounding box,
 * segmentation mask, label, and confidence score.
 * @category Types
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
 * Creates an instance segmenter runner for executing local Instance
 * Segmentation models.
 *
 * It validates model input/output tensor shapes and types, pre-allocates
 * execution and auxiliary tensors, sets up an image preprocessor, and returns
 * execution and resource management controls.
 * @category Typescript API
 * @typeParam F The bounding box format type.
 * @typeParam L The label type.
 * @param config Model configuration containing path and options.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to an object containing instance segmentation
 * and disposal controls.
 */
export async function createInstanceSegmenter<F extends BoxFormat, L>(
  config: InstanceSegmenterModel<F, L>,
  runtime?: WorkletRuntime
): Promise<{
  /**
   * Releases all allocated native resources.
   */
  dispose: () => void;

  /**
   * Performs asynchronous instance segmentation on the given input image.
   * @param input The input image buffer.
   * @param options Execution override options.
   * @param options.confidenceThreshold Minimum confidence threshold. If
   * omitted, uses `modelOpts.defaultConfidenceThreshold`.
   * @param options.iouThreshold Intersection over Union (IoU) threshold in NMS. If omitted, uses
   * `modelOpts.defaultIouThreshold`.
   * @param options.maskThreshold Mask binarization threshold. If omitted,
   * uses `modelOpts.defaultMaskThreshold`.
   * @returns A promise resolving to a list of detected instances.
   */
  segmentInstances: (
    input: ImageBuffer,
    options?: { confidenceThreshold?: number; iouThreshold?: number; maskThreshold?: number }
  ) => Promise<InstanceSegmentationResult<F, L>[]>;

  /**
   * Synchronous version of {@link segmentInstances} to be executed directly on
   * the caller or worklet thread.
   */
  segmentInstancesWorklet: (
    input: ImageBuffer,
    options?: { confidenceThreshold?: number; iouThreshold?: number; maskThreshold?: number }
  ) => InstanceSegmentationResult<F, L>[];
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
      SymbolicTensor('float32', ['N', 'MH', 'MW']),
    ]
  );

  const inpShape = meta.inputTensorMeta[0]!.shape;

  const outBoxesShape = meta.outputTensorMeta[0]!.shape;
  const outScoresShape = meta.outputTensorMeta[1]!.shape;
  const outClassesShape = meta.outputTensorMeta[2]!.shape;
  const outMasksShape = meta.outputTensorMeta[3]!.shape;

  const maskH = outMasksShape[1]!;
  const maskW = outMasksShape[2]!;
  const targetH = inpShape.at(-2)!;
  const targetW = inpShape.at(-1)!;

  const tensors = [
    tensor('float32', outBoxesShape),
    tensor('float32', outScoresShape),
    tensor('float32', outClassesShape),
    tensor('float32', outMasksShape),
    tensor('float32', [maskH, maskW, 1]),
  ] as const;

  const [tBoxes, tScores, tClasses, tAllMasks, tMask] = tensors;

  const preprocessor = createImagePreprocessor(modelOpts, inpShape);

  const dispose = () => {
    preprocessor.dispose();
    tensors.forEach((t) => t.dispose());
    model.dispose();
  };

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
          throw new Error(
            `InstanceSegmenter: Predicted class index ${classIdx} is ` +
              `out of bounds for labels array of size ${modelOpts.labels.length}.`
          );
        }

        const a = boxes[idx * 4]!;
        const b = boxes[idx * 4 + 1]!;
        const c = boxes[idx * 4 + 2]!;
        const d = boxes[idx * 4 + 3]!;

        const box = scaleBox(decodeBox([a, b, c, d], modelOpts.boxFormat), {
          from: { width: targetW, height: targetH },
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
}
