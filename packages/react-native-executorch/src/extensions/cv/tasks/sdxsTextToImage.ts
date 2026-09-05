/**
 * SDXS single-step text-to-image generation pipeline with latent diffusion and
 * TAESD decoding.
 */

import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateSpec, method, i64, f32 } from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';
import { createResourceScope } from '../../../core/lifetime';
import { randomNormal } from '../../math';
import { loadTokenizer } from '../../nlp/tokenizer';

import type { ImageBuffer } from '../image';
import { toChannelsLast, normalize, cvtColor } from '../ops/image';

// SDXS-512-DreamShaper is a Stable-Diffusion-1.5-style pipeline: a CLIP text
// encoder (77 tokens, 768 hidden), a UNet operating on 4-channel latents at
// 1/8 resolution, and a TAESD tiny decoder. Unlike the classic pipeline it is a
// distilled, single-step model run without classifier-free guidance, so there
// is no unconditional branch and no denoising loop.
const CLIP_MAX_TOKENS = 77;
const CLIP_HIDDEN_SIZE = 768;
const CLIP_PAD_TOKEN_ID = 49407;

const IMAGE_SIZE = 512;
const LATENT_CHANNELS = 4;
const LATENT_SIZE = IMAGE_SIZE / 8; // The UNet operates at 1/8 of the image resolution.
const LATENT_SHAPE = [1, LATENT_CHANNELS, LATENT_SIZE, LATENT_SIZE];
const INIT_NOISE_SIGMA = 1.0; // Scheduler's initial latents are standard normal.

// At the distilled single step the DEIS update collapses to an exactly linear
// combination of the latents and the UNet output:
// `clean = SAMPLE_COEFF * latents + NOISE_COEFF * modelOutput`. These hold only
// for one step at TIMESTEP — re-applying them would not be a valid schedule.
const TIMESTEP = 999;
const SAMPLE_COEFF = 14.642591;
const NOISE_COEFF = -14.579279;

/**
 * Model configuration required to instantiate the SDXS text-to-image runner.
 * @category CV / Types
 */
export type SdxsTextToImageModel = {
  /** Local path to the model `.pte`. */
  readonly modelPath: string;
  /** Local path to the CLIP `tokenizer.json`. */
  readonly tokenizerPath: string;
};

/**
 * SDXS single-step text-to-image generation task runner.
 * @category CV / Types
 */
export type SdxsTextToImage = {
  /**
   * Releases all allocated native resources.
   */
  readonly dispose: () => void;

  /**
   * Generates an image from a text prompt.
   * @param prompt The text prompt describing the desired image.
   * @param seed Seed for the initial latent noise (same seed → same image).
   * Defaults to a time-based value so omitting it yields a fresh image each call.
   * @returns A promise resolving to the generated RGBA image buffer.
   * @throws {RnExecuTorchError} With code `RESOURCE_BUSY` if the model is in
   * use, or `RESOURCE_DISPOSED` if disposed.
   */
  readonly generate: (prompt: string, seed?: number) => Promise<ImageBuffer>;

  /**
   * Synchronous version of {@link generate} to be executed directly on the
   * caller or worklet thread.
   */
  readonly generateWorklet: (prompt: string, seed?: number) => ImageBuffer;
};

/**
 * Creates an SDXS text-to-image runner.
 *
 * It validates the exported method schemas, pre-allocates the static execution
 * tensors, and registers disposal hooks that release all native memory.
 * @category CV / Tasks
 * @param config SDXS pipeline configuration containing the model and tokenizer paths.
 * See {@link SdxsTextToImageModel}.
 * @param runtime Optional worklet runtime thread on which to run generation.
 * @returns A promise resolving to the instantiated {@link SdxsTextToImage} runner.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if model or tokenizer
 * fails to load, or `SCHEMA_MISMATCH` if model schema does not match SDXS spec.
 */
export async function createSdxsTextToImage(
  config: SdxsTextToImageModel,
  runtime?: WorkletRuntime
): Promise<SdxsTextToImage> {
  const scope = createResourceScope();
  const dispose = scope.dispose;

  try {
    const { modelPath, tokenizerPath } = config;
    const model = scope.track(await wrapAsync(loadModel, runtime)(modelPath));
    const tokenizer = scope.track(await wrapAsync(loadTokenizer, runtime)(tokenizerPath));

    validateSpec(model.schema, {
      default: {
        ...method(
          'encode', // prettier-ignore
          [i64(1, CLIP_MAX_TOKENS)],
          [f32(1, CLIP_MAX_TOKENS, CLIP_HIDDEN_SIZE)]
        ),
        ...method(
          'denoise',
          [f32(...LATENT_SHAPE), i64(1), f32(1, CLIP_MAX_TOKENS, CLIP_HIDDEN_SIZE)],
          [f32(...LATENT_SHAPE)]
        ),
        ...method(
          'decode', // prettier-ignore
          [f32(...LATENT_SHAPE)],
          [f32(1, 3, IMAGE_SIZE, IMAGE_SIZE)]
        ),
      },
    });

    const tensors = [
      tensor('int64', [1, CLIP_MAX_TOKENS]),
      tensor('float32', [1, CLIP_MAX_TOKENS, CLIP_HIDDEN_SIZE]),
      tensor('int64', [1]),
      tensor('float32', LATENT_SHAPE),
      tensor('float32', LATENT_SHAPE),
      tensor('float32', [1, 3, IMAGE_SIZE, IMAGE_SIZE]),
      tensor('float32', [3, IMAGE_SIZE, IMAGE_SIZE]),
      tensor('uint8', [3, IMAGE_SIZE, IMAGE_SIZE]),
      tensor('uint8', [IMAGE_SIZE, IMAGE_SIZE, 3]),
      tensor('uint8', [IMAGE_SIZE, IMAGE_SIZE, 4]),
    ] as const;

    tensors.forEach(scope.track);

    // prettier-ignore
    const [
      tTokens, tEmbeddings, tTimestep, tLatents, tNoisePred,
      tDecoded, tReshape, tUint8, tChanLast, tRgba
    ] = tensors;

    const generateWorklet = (prompt: string, seed?: number): ImageBuffer => {
      'worklet';

      const ids = tokenizer.encode(prompt);
      const tokens = new BigInt64Array(CLIP_MAX_TOKENS);
      for (let i = 0; i < CLIP_MAX_TOKENS; i++) {
        tokens[i] = BigInt(i < ids.length ? ids[i]! : CLIP_PAD_TOKEN_ID);
      }
      tTokens.setData(tokens);
      model.execute('encode', [tTokens], [tEmbeddings]);

      tLatents.setData(randomNormal(tLatents.numel, { std: INIT_NOISE_SIGMA, seed }));
      tTimestep.setData(new BigInt64Array([BigInt(TIMESTEP)]));
      model.execute('denoise', [tLatents, tTimestep, tEmbeddings], [tNoisePred]);

      const latents = tLatents.getData(new Float32Array(tLatents.numel));
      const modelOutput = tNoisePred.getData(new Float32Array(tNoisePred.numel));
      for (let i = 0; i < latents.length; i++) {
        latents[i] = SAMPLE_COEFF * latents[i]! + NOISE_COEFF * modelOutput[i]!;
      }
      tLatents.setData(latents);

      model.execute('decode', [tLatents], [tDecoded]);

      const data = tDecoded
        .copyTo(tReshape)
        .through(normalize, tUint8, { alpha: 255.0 })
        .through(toChannelsLast, tChanLast)
        .through(cvtColor, tRgba, 'RGB2RGBA')
        .getData(new Uint8Array(IMAGE_SIZE * IMAGE_SIZE * 4));

      return { data, width: IMAGE_SIZE, height: IMAGE_SIZE, format: 'rgba', layout: 'hwc' };
    };

    const generate = wrapAsync(generateWorklet, runtime);

    return { generate, generateWorklet, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
