/**
 * Image inpainting task pipeline: fills a masked region of a photo with
 * plausible content (object removal, blemish cleanup), with the crop around the
 * hole, the model I/O normalization, and the feathered blend back into the
 * frame handled here.
 */

import type { WorkletRuntime } from 'react-native-worklets';

import { tensor, type Tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateSpec, method, f32 } from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';
import { createResourceScope } from '../../../core/lifetime';
import { RnExecuTorchError } from '../../../core/error';
import { threshold } from '../../math';

import type { ImageBuffer } from '../image';
import {
  FORMAT_CHANNELS,
  FORMAT_CONVERSION,
  resize,
  cvtColor,
  toChannelsFirst,
  toChannelsLast,
  normalize,
  crop,
  paste,
  blendMasked,
  type InterpolationMethod,
  type BlendMaskedOptions,
} from '../ops/image';
import { maskBounds, type BoundingBox } from '../ops/box';

/**
 * Options for configuring the inpainting preprocessor and postprocessor.
 * @category CV / Types
 */
export type InpainterOptions = {
  /**
   * Interpolation used to bring the crop around the hole to the model's input
   * size. The mask is always resized nearest-neighbor so it stays binary.
   */
  readonly interpolation: InterpolationMethod;
  /** Interpolation used to bring the model output back to the crop's size. */
  readonly outInterpolation: InterpolationMethod;
  /**
   * Context kept around the hole, in pixels on each side of its bounding box,
   * when cropping the region the model sees. The crop is square, never smaller
   * than the model input, and clamped to the image.
   */
  readonly cropPadding: number;
  /**
   * How the filled region is blended back over the original pixels. See
   * {@link BlendMaskedOptions}.
   */
  readonly blend: BlendMaskedOptions;
};

/**
 * Model configuration required to instantiate an inpainting task runner.
 * @category CV / Types
 */
export type InpainterModel = {
  /** Local path or remote URL of the `.pte` model file. */
  readonly modelPath: string;
  /**
   * Crop, interpolation and blending options. See {@link InpainterOptions}.
   */
  readonly modelOpts: InpainterOptions;
};

/**
 * The window of an image an inpainting model is run on, in pixels of that
 * image.
 * @category CV / Types
 */
export type InpaintingCrop = {
  /** Column of the window's left edge. */
  readonly x: number;
  /** Row of the window's top edge. */
  readonly y: number;
  /** Window width. */
  readonly width: number;
  /** Window height. */
  readonly height: number;
};

/**
 * Image inpainting task runner.
 * @category CV / Types
 */
export type Inpainter = {
  /**
   * Releases all allocated native resources.
   */
  readonly dispose: () => void;

  /**
   * Fills the masked region of `image` and returns the whole frame with the
   * hole filled.
   * @param image The input image buffer.
   * @param mask A buffer of the same dimensions as `image` marking the region
   * to fill: any non-zero pixel is part of the hole. A `'gray'` buffer is used
   * as is; other formats are converted to grayscale first. An all-zero mask
   * returns the input unchanged without running the model.
   * @returns A promise resolving to the inpainted RGBA image buffer at the
   * input dimensions.
   * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if `mask` does not
   * match the dimensions of `image`, `RESOURCE_BUSY` if the model is in use,
   * or `RESOURCE_DISPOSED` if disposed.
   */
  readonly inpaint: (image: ImageBuffer, mask: ImageBuffer) => Promise<ImageBuffer>;

  /**
   * Synchronous version of {@link inpaint} to be executed directly on the
   * caller or worklet thread.
   */
  readonly inpaintWorklet: (image: ImageBuffer, mask: ImageBuffer) => ImageBuffer;
};

/**
 * Finds the window of an image an inpainting model should be run on: a square
 * around the hole's bounding box, padded by `padding` on each side, never
 * smaller than `minSize`, and clamped to the image, with any overhang pushed
 * to the opposite side so the window stays as large as it can.
 *
 * The hole is scanned natively. An image buffer is converted to grayscale
 * first, exactly as {@link Inpainter.inpaint} does before feeding the model, so
 * a pixel is masked when its gray value is non-zero. A tensor is scanned as is,
 * with a pixel masked when any of its channels is non-zero.
 * @category CV / Functions
 * @param mask The hole mask: an image buffer of any format, or a `uint8` tensor
 * in HWC layout.
 * @param options Context to keep around the hole and the smallest window to
 * return, both in pixels.
 * @returns The window, or `null` when the mask marks no pixel.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if a tensor mask is
 * not a `uint8` HWC tensor, `RESOURCE_BUSY` if it is in use, or
 * `RESOURCE_DISPOSED` if it was disposed.
 */
export function computeInpaintingCrop(
  mask: ImageBuffer | Tensor,
  options: { readonly padding: number; readonly minSize: number }
): InpaintingCrop | null {
  'worklet';
  let bounds: BoundingBox<'xyxy'> | null;
  let width: number;
  let height: number;
  // A tensor is a native host object, for which the `in` operator is not
  // reliable, so an image buffer is told apart by its layout tag instead.
  if ((mask as Partial<ImageBuffer>).layout === 'hwc') {
    mask = mask as ImageBuffer;
    ({ width, height } = mask);
    const toGray = FORMAT_CONVERSION[mask.format].gray;
    const tMask = tensor('uint8', [height, width, FORMAT_CHANNELS[mask.format]]);
    let tGray: Tensor | null = null;
    try {
      tMask.setData(mask.data);
      if (toGray !== null) {
        tGray = tMask.through(cvtColor, tensor('uint8', [height, width, 1]), toGray);
      }
      bounds = maskBounds(tGray ?? tMask);
    } finally {
      tMask.dispose();
      tGray?.dispose();
    }
  } else {
    mask = mask as Tensor;
    bounds = maskBounds(mask);
    height = mask.shape[0]!;
    width = mask.shape[1]!;
  }
  if (bounds === null) return null;
  const { xmin: left, ymin: top, xmax: right, ymax: bottom } = bounds;

  const centerX = Math.floor((left + right) / 2);
  const centerY = Math.floor((top + bottom) / 2);
  const extent = Math.max(right - left + 1, bottom - top + 1) + 2 * options.padding;
  const size = Math.max(extent, options.minSize);
  const half = Math.floor(size / 2);

  let x0 = Math.max(centerX - half, 0);
  let x1 = Math.min(centerX - half + size, width);
  let y0 = Math.max(centerY - half, 0);
  let y1 = Math.min(centerY - half + size, height);

  const overhangX = Math.max(size - (x1 - x0), 0);
  const overhangY = Math.max(size - (y1 - y0), 0);
  x0 = Math.max(x0 - overhangX, 0);
  x1 = Math.min(x1 + overhangX, width);
  y0 = Math.max(y0 - overhangY, 0);
  y1 = Math.min(y1 + overhangY, height);

  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/**
 * Creates an image inpainting runner for executing local inpainting models.
 *
 * It validates the model inputs and outputs requirements, pre-allocates the
 * necessary static execution tensors, and registers clean disposal hooks to
 * clear all native memory. The model is expected to take an RGB image in
 * `[0, 1]` and a mask with `1` for known pixels and `0` for the hole, and to
 * return the filled RGB image in `[0, 1]`, all at a fixed resolution.
 * @category CV / Tasks
 * @param config Inpainting task configuration containing path and options.
 * See {@link InpainterModel}.
 * @param runtime Optional worklet runtime thread on which to run the model execution.
 * @returns A promise resolving to the instantiated {@link Inpainter} runner.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if model fails to load,
 * or `SCHEMA_MISMATCH` if model schema does not match the inpainting spec.
 */
export async function createInpainter(
  config: InpainterModel,
  runtime?: WorkletRuntime
): Promise<Inpainter> {
  const scope = createResourceScope();
  const dispose = scope.dispose;

  try {
    const { modelPath, modelOpts } = config;
    const model = scope.track(await wrapAsync(loadModel, runtime)(modelPath));

    const { variant, dims } = validateSpec(model.schema, {
      batched: method(
        'forward', // prettier-ignore
        [f32(1, 3, 'H', 'W'), f32(1, 1, 'H', 'W')],
        [f32(1, 3, 'H', 'W')]
      ),
      unbatched: method(
        'forward', // prettier-ignore
        [f32(3, 'H', 'W'), f32(1, 'H', 'W')],
        [f32(3, 'H', 'W')]
      ),
    });

    const [H, W] = dims.constant('H', 'W');
    const imageShape = { batched: [1, 3, H, W], unbatched: [3, H, W] }[variant];
    const maskShape = { batched: [1, 1, H, W], unbatched: [1, H, W] }[variant];

    const tensors = [
      // Model I/O.
      tensor('float32', imageShape),
      tensor('float32', maskShape),
      tensor('float32', imageShape),
      // Image: resized RGB crop -> CHW -> normalized.
      tensor('uint8', [H, W, 3]),
      tensor('uint8', [3, H, W]),
      tensor('float32', [3, H, W]),
      // Mask: resized -> CHW -> float -> binarized (1 = hole) -> inverted (1 = known).
      tensor('uint8', [H, W, 1]),
      tensor('uint8', [1, H, W]),
      tensor('float32', [1, H, W]),
      tensor('float32', [1, H, W]),
      tensor('float32', [1, H, W]),
      // Output: CHW float -> uint8 -> HWC -> RGBA.
      tensor('float32', [3, H, W]),
      tensor('uint8', [3, H, W]),
      tensor('uint8', [H, W, 3]),
      tensor('uint8', [H, W, 4]),
    ] as const;

    tensors.forEach(scope.track);

    const [
      tModelImage,
      tModelMask,
      tModelOutput,
      tInRgb,
      tInChw,
      tInNorm,
      tMaskResized,
      tMaskChw,
      tMaskFloat,
      tMaskHole,
      tMaskKnown,
      tOutChw,
      tOutU8,
      tOutHwc,
      tOutRgba,
    ] = tensors;

    const { interpolation, outInterpolation, cropPadding, blend } = modelOpts;
    const minCropSize = Math.max(H, W);

    const inpaintWorklet = (image: ImageBuffer, mask: ImageBuffer): ImageBuffer => {
      'worklet';
      if (mask.width !== image.width || mask.height !== image.height) {
        throw RnExecuTorchError(
          'INVALID_ARGUMENT',
          `inpaint: mask is ${mask.width}x${mask.height} but image is ${image.width}x${image.height}`
        );
      }

      const { width, height } = image;
      const imageChannels = FORMAT_CHANNELS[image.format];
      const toRgba = FORMAT_CONVERSION[image.format].rgba;
      const maskChannels = FORMAT_CHANNELS[mask.format];
      const toGray = FORMAT_CONVERSION[mask.format].gray;

      const perCall: Tensor[] = [];
      const scratch = (dtype: 'uint8', shape: number[]): Tensor => {
        const t = tensor(dtype, shape);
        perCall.push(t);
        return t;
      };

      try {
        // The full-resolution RGBA frame the result is assembled in.
        const tImage = scratch('uint8', [height, width, imageChannels]).setData(image.data);
        const tFrame =
          toRgba === null
            ? tImage
            : tImage.through(cvtColor, scratch('uint8', [height, width, 4]), toRgba);

        const tMaskIn = scratch('uint8', [height, width, maskChannels]).setData(mask.data);
        const tMaskGray =
          toGray === null
            ? tMaskIn
            : tMaskIn.through(cvtColor, scratch('uint8', [height, width, 1]), toGray);

        const window = computeInpaintingCrop(tMaskGray, {
          padding: cropPadding,
          minSize: minCropSize,
        });
        if (window !== null) {
          const { x, y, width: cw, height: ch } = window;

          // Image crop -> model input.
          const tCrop = tFrame.through(crop, scratch('uint8', [ch, cw, 4]), { x, y });
          tCrop
            .through(cvtColor, scratch('uint8', [ch, cw, 3]), 'RGBA2RGB')
            .through(resize, tInRgb, { mode: 'stretch', interpolation })
            .through(toChannelsFirst, tInChw)
            .through(normalize, tInNorm, { alpha: 1 / 255, beta: 0 })
            .copyTo(tModelImage);

          // Mask crop -> model input, binarized so any non-zero value is the
          // hole, then inverted to the model's 1 = known convention.
          const tMaskCrop = tMaskGray.through(crop, scratch('uint8', [ch, cw, 1]), { x, y });
          tMaskCrop
            .through(resize, tMaskResized, { mode: 'stretch', interpolation: 'nearest' })
            .through(toChannelsFirst, tMaskChw)
            .through(normalize, tMaskFloat, { alpha: 1, beta: 0 })
            .through(threshold, tMaskHole, 0.5)
            .through(normalize, tMaskKnown, { alpha: -1, beta: 1 })
            .copyTo(tModelMask);

          model.execute('forward', [tModelImage, tModelMask], [tModelOutput]);

          // Model output -> RGBA at crop size, blended into the crop over the
          // original pixels, then pasted back into the frame.
          const tFilled = tModelOutput
            .copyTo(tOutChw)
            .through(normalize, tOutU8, { alpha: 255, beta: 0 })
            .through(toChannelsLast, tOutHwc)
            .through(cvtColor, tOutRgba, 'RGB2RGBA')
            .through(resize, scratch('uint8', [ch, cw, 4]), {
              mode: 'stretch',
              interpolation: outInterpolation,
            });

          blendMasked(tCrop, tFilled, tMaskCrop, scratch('uint8', [ch, cw, 4]), blend).through(
            paste,
            tFrame,
            { x, y }
          );
        }

        const data = tFrame.getData(new Uint8Array(width * height * 4));
        return { data, width, height, format: 'rgba', layout: 'hwc' };
      } finally {
        perCall.forEach((t) => t.dispose());
      }
    };

    const inpaint = wrapAsync(inpaintWorklet, runtime);

    return { inpaint, inpaintWorklet, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
