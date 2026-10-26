/**
 * Image inpainting task pipeline: fills a masked region of a photo with
 * plausible content (object removal, blemish cleanup). The whole frame is
 * resized to the model input, and the output is resized back and blended into
 * the original pixels through the mask, so only the hole changes.
 */

import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
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
  blendMasked,
  type InterpolationMethod,
  type BlendMaskedOptions,
} from '../ops/image';

/**
 * Options for configuring the inpainting preprocessor and postprocessor.
 * @category CV / Types
 */
export type InpainterOptions = {
  /**
   * Interpolation used to bring the image to the model's input size. The mask
   * is always area-resized and re-binarized, so a model pixel is part of the
   * hole when any of the photo pixels it covers is.
   */
  readonly interpolation: InterpolationMethod;
  /** Interpolation used to bring the model output back to the image's size. */
  readonly outInterpolation: InterpolationMethod;
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
   * Interpolation and blending options. See {@link InpainterOptions}.
   */
  readonly modelOpts: InpainterOptions;
};

/**
 * The hole to fill, as a single-channel buffer: any non-zero pixel is part of
 * the hole.
 * @category CV / Types
 */
export type MaskBuffer = ImageBuffer & { readonly format: 'gray' };

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
   * hole filled. The model sees the whole frame stretched to its input size;
   * to fill a small hole in a large photo at higher detail, crop the region
   * around it first and inpaint the crop.
   * @param image The input image buffer.
   * @param mask A `'gray'` buffer of the same dimensions as `image` marking the
   * region to fill: any non-zero pixel is part of the hole. Pixels outside the
   * hole are returned unchanged.
   * @returns A promise resolving to the inpainted RGBA image buffer at the
   * input dimensions.
   * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if `mask` is not
   * a `'gray'` buffer or does not match the dimensions of `image`,
   * `RESOURCE_BUSY` if the model is in use, or `RESOURCE_DISPOSED` if disposed.
   */
  readonly inpaint: (image: ImageBuffer, mask: MaskBuffer) => Promise<ImageBuffer>;

  /**
   * Synchronous version of {@link inpaint} to be executed directly on the
   * caller or worklet thread.
   */
  readonly inpaintWorklet: (image: ImageBuffer, mask: MaskBuffer) => ImageBuffer;
};

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
      // Image: resized RGBA -> RGB -> CHW -> normalized.
      tensor('uint8', [H, W, 4]),
      tensor('uint8', [H, W, 3]),
      tensor('uint8', [3, H, W]),
      tensor('float32', [3, H, W]),
      // Mask: resized -> CHW -> float (1 = known, < 1 = hole) -> binarized.
      tensor('uint8', [H, W, 1]),
      tensor('uint8', [1, H, W]),
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
      tInRgba,
      tInRgb,
      tInChw,
      tInNorm,
      tMaskResized,
      tMaskChw,
      tMaskScaled,
      tMaskKnown,
      tOutChw,
      tOutU8,
      tOutHwc,
      tOutRgba,
    ] = tensors;

    const { interpolation, outInterpolation, blend } = modelOpts;

    const inpaintWorklet = (image: ImageBuffer, mask: MaskBuffer): ImageBuffer => {
      'worklet';
      if (mask.format !== 'gray') {
        throw RnExecuTorchError(
          'INVALID_ARGUMENT',
          `inpaint: mask must be a 'gray' buffer (got '${mask.format}')`
        );
      }
      if (mask.width !== image.width || mask.height !== image.height) {
        throw RnExecuTorchError(
          'INVALID_ARGUMENT',
          `inpaint: mask is ${mask.width}x${mask.height} but image is ${image.width}x${image.height}`
        );
      }

      const { width, height } = image;
      const imageChannels = FORMAT_CHANNELS[image.format];
      const toRgba = FORMAT_CONVERSION[image.format].rgba;

      // Per-call buffers at the frame's resolution: the input as given, the
      // frame as RGBA, the mask, the upsampled fill and the blended result.
      const auxTensors = [
        tensor('uint8', [height, width, imageChannels]),
        tensor('uint8', [height, width, 4]),
        tensor('uint8', [height, width, 1]),
        tensor('uint8', [height, width, 4]),
        tensor('uint8', [height, width, 4]),
      ] as const;
      const [tImage, tRgba, tMask, tFilled, tResult] = auxTensors;

      try {
        // The full-resolution RGBA frame the filled region is blended into.
        const tFrame = tImage
          .setData(image.data)
          .throughIf(toRgba !== null, cvtColor, tRgba, toRgba!);
        tMask.setData(mask.data);

        // Whole frame -> model input.
        tFrame
          .through(resize, tInRgba, { mode: 'stretch', interpolation })
          .through(cvtColor, tInRgb, 'RGBA2RGB')
          .through(toChannelsFirst, tInChw)
          .through(normalize, tInNorm, { alpha: 1 / 255, beta: 0 })
          .copyTo(tModelImage);

        // Mask -> model input. Area resizing keeps strokes thinner than the
        // downscale factor as non-zero values, so binarizing at any non-zero
        // value never drops part of the hole. The scaling maps 0 (known) to 1
        // and every non-zero value below 1, so a threshold just under 1 yields
        // the model's 1 = known / 0 = hole mask in one step; the copy reshapes
        // it to the model's rank.
        tMask
          .through(resize, tMaskResized, { mode: 'stretch', interpolation: 'area' })
          .through(toChannelsFirst, tMaskChw)
          .through(normalize, tMaskScaled, { alpha: -1 / 255, beta: 1 })
          .through(threshold, tMaskKnown, 1 - 0.5 / 255)
          .copyTo(tModelMask);

        model.execute('forward', [tModelImage, tModelMask], [tModelOutput]);

        // Model output -> RGBA at the frame's size, blended over the original
        // pixels through the full-resolution mask.
        tModelOutput
          .copyTo(tOutChw)
          .through(normalize, tOutU8, { alpha: 255, beta: 0 })
          .through(toChannelsLast, tOutHwc)
          .through(cvtColor, tOutRgba, 'RGB2RGBA')
          .through(resize, tFilled, { mode: 'stretch', interpolation: outInterpolation });
        blendMasked(tFrame, tFilled, tMask, tResult, blend);

        const data = tResult.getData(new Uint8Array(width * height * 4));
        return { data, width, height, format: 'rgba', layout: 'hwc' };
      } finally {
        auxTensors.forEach((t) => t.dispose());
      }
    };

    const inpaint = wrapAsync(inpaintWorklet, runtime);

    return { inpaint, inpaintWorklet, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
