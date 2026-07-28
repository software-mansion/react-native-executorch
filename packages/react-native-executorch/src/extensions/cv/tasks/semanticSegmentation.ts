import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateSpec, method, f32 } from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';

import type { ImageBuffer } from '../image';
import { createImagePreprocessor, type ImagePreprocessorOptions } from './preprocessing';
import {
  toChannelsLast,
  normalize,
  resize,
  cvtColor,
  applyColormap,
  type InterpolationMethod,
} from '../ops/image';
import { sigmoid, argmax } from '../../math';

/**
 * Options for configuring a semantic segmenter preprocessor and label
 * vocabulary.
 * @category Types
 */
export type SemanticSegmenterOptions<L> = Omit<ImagePreprocessorOptions, 'resizeMode'> & {
  /** Resize mode for input images. Must be `'stretch'`. */
  readonly resizeMode: 'stretch';
  /** Interpolation method used when resizing output masks back to input image dimensions. */
  readonly outInterpolation: InterpolationMethod;
  /** Array of class labels matching the model's output vocabulary. */
  readonly labels: readonly L[];
};

/**
 * Model configuration required to instantiate a segmenter task runner.
 * @category Types
 */
export type SemanticSegmenterModel<L> = {
  /** Local path or remote URL of the `.pte` model file. */
  readonly modelPath: string;
  /**
   * Image preprocessing, output mask interpolation, and label
   * vocabulary {@link SemanticSegmenterOptions}. `resizeMode`
   * is fixed to `'stretch'`.
   */
  readonly modelOpts: SemanticSegmenterOptions<L>;
};

/**
 * Maps each class label to its assigned RGBA color.
 * @category Types
 */
export type ColorMap<L extends PropertyKey> = Record<L, [number, number, number, number]>;

/**
 * Result structure representing the output of a semantic segmentation task.
 * @category Types
 */
export type SemanticSegmentationResult<L extends PropertyKey> = {
  /** Generated output RGBA image buffer containing the colored segmentation mask. */
  readonly buffer: ImageBuffer;
  /** Applied color map mapping each class label to its RGBA tuple. */
  readonly colormap?: ColorMap<L>;
};

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

/**
 * Creates a semantic segmenter runner for executing local Semantic Segmentation
 * models.
 *
 * It validates the model inputs and outputs, asserts that the labels array
 * length matches the model's output vocabulary size, pre-allocates the
 * necessary static execution tensors, sets up an image preprocessor, and
 * registers clean disposal hooks to clear all native memory.
 * @category Typescript API
 * @typeParam L The type representing the segmentation labels.
 * @param config Segmenter task configuration containing path and options.
 * @param runtime Optional worklet runtime thread environment context.
 * @returns A promise resolving to an object containing segmentation and
 * disposal controls.
 */
export async function createSemanticSegmenter<L extends PropertyKey = string>(
  config: SemanticSegmenterModel<L>,
  runtime?: WorkletRuntime
): Promise<{
  /**
   * Releases all allocated native resources.
   */
  dispose: () => void;
  /**
   * Runs semantic segmentation asynchronously.
   *
   * For models returning logits for all classes, this performs an argmax over
   * the class dimensions to identify the highest-probability class per pixel,
   * then maps each class index to an RGBA color from the colormap. The final
   * mapped colormap is returned in the result.
   *
   * For models returning only a single logit value for the positive class, this
   * applies a sigmoid activation, normalizes the probability values to
   * grayscale (0-255), and converts the output to a grayscale RGBA mask. No
   * colormap is applied, and the colormap in the result is undefined.
   * @param input The input image buffer to segment.
   * @param colormap Optional partial color mapping overrides for labels
   * (applicable only for multi-class models). If not provided, a default
   * colormap is automatically generated with distinct, high-contrast colors
   * (with the first label defaulting to transparent). If a partial map is
   * provided, any labels omitted from it will default to being rendered as
   * fully transparent.
   * @returns A promise resolving to the segmentation result.
   */
  segment: (
    input: ImageBuffer,
    colormap?: Partial<ColorMap<L>>
  ) => Promise<SemanticSegmentationResult<L>>;
  /**
   * Runs semantic segmentation synchronously.
   * @see {@link segment} for details.
   */
  segmentWorklet: (
    input: ImageBuffer,
    colormap?: Partial<ColorMap<L>>
  ) => SemanticSegmentationResult<L>;
}> {
  const { modelPath, modelOpts } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  const { variant, dims } = validateSpec(model.schema, {
    batched: method(
      'forward', // prettier-ignore
      [f32(1, 3, 'H', 'W')],
      [f32(1, 'K', 'H', 'W')]
    ),
    unbatched: method(
      'forward', // prettier-ignore
      [f32(3, 'H', 'W')],
      [f32('K', 'H', 'W')]
    ),
  });

  const [nClasses, H, W] = dims.constant('K', 'H', 'W');
  const inpShape = { batched: [1, 3, H, W], unbatched: [3, H, W] }[variant];
  const outShape = { batched: [1, nClasses, H, W], unbatched: [nClasses, H, W] }[variant];

  // Generate highly distinct, high-contrast colors, see:
  // https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
  const defaultColormap = modelOpts.labels.map((_, i) => {
    if (i === 0) return [0, 0, 0, 0] as const;
    return [...hslToRgb((i * 137.5) % 360, 95, 50), 255] as const;
  });

  if (nClasses > 1 && modelOpts.labels.length !== nClasses) {
    throw new Error(
      `Model outputs ${nClasses} classes, but ${modelOpts.labels.length} labels were provided in the configuration.`
    );
  }

  const tensors = [
    tensor('float32', outShape),
    tensor('float32', [nClasses, H, W]),
    tensor('float32', [nClasses, H, W]),
    tensor('float32', [H, W, nClasses]),
    tensor(nClasses > 1 ? 'int32' : 'uint8', [H, W, 1]),
    tensor('uint8', [H, W, 4]),
  ] as const;

  const [tOutput, tReshape, tSigmoid, tChanLast, tMask, tRgba] = tensors;
  const preprocessor = createImagePreprocessor(modelOpts, inpShape);

  const dispose = () => {
    tensors.forEach((t) => t.dispose());
    preprocessor.dispose();
    model.dispose();
  };

  const segmentWorklet = (
    input: ImageBuffer,
    colormap?: Partial<ColorMap<L>>
  ): SemanticSegmentationResult<L> => {
    'worklet';
    const tInput = preprocessor.process(input);
    model.execute('forward', [tInput], [tOutput]);

    let returnColormap: ColorMap<L> | undefined;
    if (nClasses > 1) {
      if (colormap) {
        returnColormap = Object.fromEntries(
          modelOpts.labels.map((l) => [l, colormap[l] ?? [0, 0, 0, 0]])
        ) as ColorMap<L>;
      } else {
        returnColormap = Object.fromEntries(
          modelOpts.labels.map((l, i) => [l, defaultColormap[i]!])
        ) as ColorMap<L>;
      }

      const colormapData = modelOpts.labels.map((l) => returnColormap![l]);

      tOutput
        .copyTo(tReshape)
        .through(toChannelsLast, tChanLast)
        .through(argmax, tMask, -1)
        .through(applyColormap, tRgba, colormapData);
    } else {
      tOutput
        .copyTo(tReshape)
        .through(sigmoid, tSigmoid)
        .through(toChannelsLast, tChanLast)
        .through(normalize, tMask, { alpha: 255.0 })
        .through(cvtColor, tRgba, 'GRAY2RGBA');
    }

    const data = new Uint8Array(input.width * input.height * 4);
    const tResize = tensor('uint8', [input.height, input.width, 4]);
    try {
      tRgba
        .through(resize, tResize, { mode: 'stretch', interpolation: modelOpts.outInterpolation })
        .getData(data);
    } finally {
      tResize.dispose();
    }

    return {
      buffer: { data, width: input.width, height: input.height, format: 'rgba', layout: 'hwc' },
      colormap: returnColormap,
    };
  };

  const segment = wrapAsync(segmentWorklet, runtime);

  return { segment, segmentWorklet, dispose };
}
