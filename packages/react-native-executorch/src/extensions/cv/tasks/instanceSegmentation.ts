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

export type InstanceSegmenterOptions<F extends BoxFormat, L> = Omit<
  ImagePreprocessorOptions,
  'resizeMode'
> & {
  readonly resizeMode: 'stretch';
  readonly labels: readonly L[];
  readonly boxFormat: F;
  readonly defaultIouThreshold: number;
  readonly defaultMaskThreshold: number;
  readonly defaultConfidenceThreshold: number;
};

export type InstanceSegmenterModel<F extends BoxFormat, L> = {
  readonly modelPath: string;
  readonly opts: InstanceSegmenterOptions<F, L>;
};

export type InstanceSegmentationResult<F extends BoxFormat, L> = {
  readonly box: BoundingBox<F>;
  readonly mask: ImageBuffer;
  readonly label: L;
  readonly confidence: number;
};

export type InstanceSegmentation<F extends BoxFormat, L> = InstanceSegmentationResult<F, L>;

export async function createInstanceSegmenter<F extends BoxFormat, L>(
  config: InstanceSegmenterModel<F, L>,
  runtime?: WorkletRuntime
): Promise<{
  dispose: () => void;

  segmentInstances: (
    input: ImageBuffer,
    options?: { confidenceThreshold?: number; iouThreshold?: number; maskThreshold?: number }
  ) => Promise<InstanceSegmentationResult<F, L>[]>;

  segmentInstancesWorklet: (
    input: ImageBuffer,
    options?: { confidenceThreshold?: number; iouThreshold?: number; maskThreshold?: number }
  ) => InstanceSegmentationResult<F, L>[];
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

  const preprocessor = createImagePreprocessor(opts, inpShape);

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

    const iouThreshold = options?.iouThreshold ?? opts.defaultIouThreshold;
    const maskThreshold = options?.maskThreshold ?? opts.defaultMaskThreshold;
    const confidenceThreshold = options?.confidenceThreshold ?? opts.defaultConfidenceThreshold;

    const eps = 1e-7;
    const clampedMaskThreshold = Math.max(eps, Math.min(1 - eps, maskThreshold));
    const logitMaskThreshold = Math.log(clampedMaskThreshold / (1 - clampedMaskThreshold));

    const indices = nms(tBoxes, tScores, {
      boxFormat: opts.boxFormat,
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
        const label = opts.labels[classIdx];

        if (label === undefined) {
          throw new Error(
            `InstanceSegmenter: Predicted class index ${classIdx} is ` +
              `out of bounds for labels array of size ${opts.labels.length}.`
          );
        }

        const a = boxes[idx * 4]!;
        const b = boxes[idx * 4 + 1]!;
        const c = boxes[idx * 4 + 2]!;
        const d = boxes[idx * 4 + 3]!;

        const box = scaleBox(decodeBox([a, b, c, d], opts.boxFormat), {
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
