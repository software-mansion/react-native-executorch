import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';
import { mulberry32, randomNormal } from '../../math';
import { loadTokenizer } from '../../nlp/tokenizer';

import type { ImageBuffer } from '../image';
import { toChannelsLast, normalize, cvtColor } from '../ops/image';

// SDXS-512-DreamShaper is a Stable-Diffusion-1.5-style pipeline: a CLIP text
// encoder (77 tokens, 768 hidden), a UNet operating on 4-channel latents at
// 1/8 resolution, and a TAESD tiny decoder. Unlike the classic pipeline it is a
// distilled, single-step model run without classifier-free guidance, so there
// is no unconditional branch and no denoising loop.
//
// Every value below is fixed by the exported program rather than being a knob:
// the shapes are static in the `.pte`, and the scheduler/decoder scalars are
// pinned during export by numerically matching the reference diffusers output.
// They are therefore constants here instead of per-model options — all shipped
// variants (XNNPACK / CoreML / MLX) differ only by which `.pte` they load.
const CLIP_MAX_TOKENS = 77;
const CLIP_HIDDEN_SIZE = 768;
// CLIP pad/eot token id (`<|endoftext|>`). Used to pad the token sequence to a
// fixed length when the tokenizer.json does not enforce a padding strategy.
const CLIP_PAD_TOKEN_ID = 49407;

const IMAGE_SIZE = 512;
const LATENT_CHANNELS = 4;
// The UNet operates at 1/8 of the image resolution.
const LATENT_SIZE = IMAGE_SIZE / 8;
// Scheduler `init_noise_sigma`: the initial latents are standard normal.
const INIT_NOISE_SIGMA = 1.0;
// The single training timestep the model was distilled for.
const TIMESTEP = 999;
// At the distilled single step the DEIS update collapses to an exactly linear
// combination of the latents and the UNet output:
// `clean = SAMPLE_COEFF * latents + NOISE_COEFF * modelOutput`. These hold only
// for one step at TIMESTEP — re-applying them would not be a valid schedule.
const SAMPLE_COEFF = 14.642591;
const NOISE_COEFF = -14.579279;
// The exported `decode` emits RGB in [0,1], so mapping to [0..255] is a plain scale.
const OUT_ALPHA = 255.0;
const OUT_BETA = 0.0;

/**
 * Model configuration required to instantiate the SDXS text-to-image runner.
 *
 * The pipeline ships as a single `.pte` program exporting three methods —
 * `encode` (text encoder), `denoise` (UNet) and `decode` (TAESD decoder) — plus
 * a CLIP `tokenizer.json`.
 * @category Types
 */
export type SdxsTextToImageModel = {
  /** Local path to the combined `encode`/`denoise`/`decode` `.pte` program. */
  readonly modelPath: string;
  /** Local path to the CLIP `tokenizer.json`. */
  readonly tokenizerPath: string;
};

/**
 * Creates an SDXS text-to-image runner backed by a single multi-method `.pte`
 * program (`encode` / `denoise` / `decode`) and a CLIP tokenizer.
 *
 * It validates the exported method schemas, pre-allocates the static execution
 * tensors, and registers disposal hooks that release all native memory.
 * @category Typescript API
 * @param config SDXS pipeline configuration containing the model and tokenizer paths.
 * @param runtime Optional worklet runtime thread on which to run generation.
 * @returns A promise resolving to an object with generation and disposal controls.
 */
export async function createSdxsTextToImage(
  config: SdxsTextToImageModel,
  runtime?: WorkletRuntime
): Promise<{
  /** Releases all allocated native resources. */
  dispose: () => void;
  /**
   * Generates an image from a text prompt.
   * @param prompt The text prompt describing the desired image.
   * @param seed Seed for the initial latent noise (same seed → same image).
   * @returns A promise resolving to the generated RGBA image buffer.
   */
  generate: (prompt: string, seed: number) => Promise<ImageBuffer>;
  /**
   * Synchronous version of {@link generate} to be executed directly on the
   * caller or worklet thread.
   */
  generateWorklet: (prompt: string, seed: number) => ImageBuffer;
}> {
  const { modelPath, tokenizerPath } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);
  const tokenizer = await wrapAsync(loadTokenizer, runtime)(tokenizerPath);

  validateModelSchema(
    model,
    'encode',
    [SymbolicTensor('int64', [1, CLIP_MAX_TOKENS])],
    [SymbolicTensor('float32', [1, CLIP_MAX_TOKENS, CLIP_HIDDEN_SIZE])]
  );
  validateModelSchema(
    model,
    'denoise',
    [
      SymbolicTensor('float32', [1, LATENT_CHANNELS, LATENT_SIZE, LATENT_SIZE]),
      SymbolicTensor('int64', [1]),
      SymbolicTensor('float32', [1, CLIP_MAX_TOKENS, CLIP_HIDDEN_SIZE]),
    ],
    [SymbolicTensor('float32', [1, LATENT_CHANNELS, LATENT_SIZE, LATENT_SIZE])]
  );
  validateModelSchema(
    model,
    'decode',
    [SymbolicTensor('float32', [1, LATENT_CHANNELS, LATENT_SIZE, LATENT_SIZE])],
    [SymbolicTensor('float32', [1, 3, IMAGE_SIZE, IMAGE_SIZE])]
  );

  const tensors = [
    tensor('int64', [1, CLIP_MAX_TOKENS]),
    tensor('float32', [1, CLIP_MAX_TOKENS, CLIP_HIDDEN_SIZE]),
    tensor('int64', [1]),
    tensor('float32', [1, LATENT_CHANNELS, LATENT_SIZE, LATENT_SIZE]),
    tensor('float32', [1, LATENT_CHANNELS, LATENT_SIZE, LATENT_SIZE]),
    tensor('float32', [1, 3, IMAGE_SIZE, IMAGE_SIZE]),
    tensor('float32', [3, IMAGE_SIZE, IMAGE_SIZE]),
    tensor('uint8', [3, IMAGE_SIZE, IMAGE_SIZE]),
    tensor('uint8', [IMAGE_SIZE, IMAGE_SIZE, 3]),
    tensor('uint8', [IMAGE_SIZE, IMAGE_SIZE, 4]),
  ] as const;

  // prettier-ignore
  const [
    tTokens, tEmbeddings, tTimestep, tLatents, tNoisePred,
    tDecoded, tReshape, tUint8, tChanLast, tRgba
  ] = tensors;

  const dispose = () => {
    tensors.forEach((t) => t.dispose());
    tokenizer.dispose();
    model.dispose();
  };

  const generateWorklet = (prompt: string, seed: number): ImageBuffer => {
    'worklet';

    const ids = tokenizer.encode(prompt);
    const tokens = new BigInt64Array(CLIP_MAX_TOKENS);
    for (let i = 0; i < CLIP_MAX_TOKENS; i++) {
      tokens[i] = BigInt(i < ids.length ? ids[i]! : CLIP_PAD_TOKEN_ID);
    }
    tTokens.setData(tokens);
    model.execute('encode', [tTokens], [tEmbeddings]);

    tLatents.setData(randomNormal(tLatents.numel, mulberry32(seed), 0, INIT_NOISE_SIGMA));
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
      .through(normalize, tUint8, { alpha: OUT_ALPHA, beta: OUT_BETA })
      .through(toChannelsLast, tChanLast)
      .through(cvtColor, tRgba, 'RGB2RGBA')
      .getData(new Uint8Array(IMAGE_SIZE * IMAGE_SIZE * 4));

    return { data, width: IMAGE_SIZE, height: IMAGE_SIZE, format: 'rgba', layout: 'hwc' };
  };

  const generate = wrapAsync(generateWorklet, runtime);

  return { generate, generateWorklet, dispose };
}
