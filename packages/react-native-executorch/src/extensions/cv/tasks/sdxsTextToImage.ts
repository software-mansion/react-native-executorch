/* eslint-disable no-bitwise */
import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';
import { loadTokenizer } from '../../nlp/tokenizer';

import type { ImageBuffer } from '../image';
import { toChannelsLast, normalize, cvtColor } from '../ops/image';

// SDXS-512-DreamShaper is a Stable-Diffusion-1.5-style pipeline: a CLIP text
// encoder (77 tokens, 768 hidden), a UNet operating on 4-channel latents at
// 1/8 resolution, and a TAESD tiny decoder. Unlike the classic pipeline it is a
// distilled, single-step model run without classifier-free guidance, so there
// is no unconditional branch and (by default) a single denoising step.
const CLIP_MAX_TOKENS = 77;
const CLIP_HIDDEN_SIZE = 768;
// CLIP pad/eot token id (`<|endoftext|>`). Used to pad the token sequence to a
// fixed length when the tokenizer.json does not enforce a padding strategy.
const CLIP_PAD_TOKEN_ID = 49407;

/**
 * Model-specific configuration for the SDXS text-to-image pipeline. These
 * constants describe how the exported program behaves and are pinned during the
 * `.pte` export by numerically matching the reference diffusers output.
 * @category Types
 */
export type SdxsOptions = {
  /** Output image side length in pixels (SDXS: 512). */
  readonly imageSize: number;
  /** Number of latent channels (SDXS: 4). */
  readonly latentChannels: number;
  /** Number of denoising steps (SDXS is distilled to 1). */
  readonly numInferenceSteps: number;
  /** Standard deviation of the initial latent noise (scheduler `init_noise_sigma`). */
  readonly initNoiseSigma: number;
  /** The single training timestep fed to the UNet for the distilled step. */
  readonly timestep: number;
  /**
   * Scheduler-step coefficient applied to the input latents. For the distilled
   * single step the DEIS update is exactly linear in the latents and the UNet
   * output — `clean = sampleCoeff * latents + noiseCoeff * modelOutput` — and
   * both coefficients are pinned from the reference scheduler during export.
   */
  readonly sampleCoeff: number;
  /** Scheduler-step coefficient applied to the UNet output (see {@link sampleCoeff}). */
  readonly noiseCoeff: number;
  /** Per-channel or scalar scale applied to the decoder output when mapping to `[0..255]`. */
  readonly outAlpha: number | number[];
  /** Per-channel or scalar bias applied to the decoder output when mapping to `[0..255]`. */
  readonly outBeta: number | number[];
};

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
  /** Model-specific pipeline configuration. */
  readonly opts: SdxsOptions;
};

function encodePrompt(ids: number[]): BigInt64Array {
  'worklet';
  const tokens = new BigInt64Array(CLIP_MAX_TOKENS);
  for (let i = 0; i < CLIP_MAX_TOKENS; i++) {
    tokens[i] = BigInt(i < ids.length ? ids[i]! : CLIP_PAD_TOKEN_ID);
  }
  return tokens;
}

// Deterministic seeded standard-normal noise (mulberry32 + Box–Muller): a fixed
// seed must reproduce the same image, and Math.random cannot be seeded.
function seededGaussian(size: number, seed: number): Float32Array {
  'worklet';
  let state = seed >>> 0;
  const next = () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = new Float32Array(size);
  for (let i = 0; i < size; i += 2) {
    const u1 = Math.max(next(), 1e-7);
    const u2 = next();
    const mag = Math.sqrt(-2.0 * Math.log(u1));
    out[i] = mag * Math.cos(2.0 * Math.PI * u2);
    if (i + 1 < size) out[i + 1] = mag * Math.sin(2.0 * Math.PI * u2);
  }
  return out;
}

function toCleanLatents(
  latents: Float32Array,
  modelOutput: Float32Array,
  opts: SdxsOptions
): Float32Array {
  'worklet';
  const out = new Float32Array(latents.length);
  for (let i = 0; i < latents.length; i++) {
    out[i] = opts.sampleCoeff * latents[i]! + opts.noiseCoeff * modelOutput[i]!;
  }
  return out;
}

/**
 * Creates an SDXS text-to-image runner backed by a single multi-method `.pte`
 * program (`encode` / `denoise` / `decode`) and a CLIP tokenizer.
 *
 * It validates the exported method schemas, pre-allocates the static execution
 * tensors, and registers disposal hooks that release all native memory.
 * @category Typescript API
 * @param config SDXS pipeline configuration containing model/tokenizer paths and options.
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
  const { modelPath, tokenizerPath, opts } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);
  const tokenizer = await wrapAsync(loadTokenizer, runtime)(tokenizerPath);

  const { imageSize, latentChannels } = opts;
  const latentSize = Math.floor(imageSize / 8);

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
      SymbolicTensor('float32', [1, latentChannels, latentSize, latentSize]),
      SymbolicTensor('int64', [1]),
      SymbolicTensor('float32', [1, CLIP_MAX_TOKENS, CLIP_HIDDEN_SIZE]),
    ],
    [SymbolicTensor('float32', [1, latentChannels, latentSize, latentSize])]
  );
  validateModelSchema(
    model,
    'decode',
    [SymbolicTensor('float32', [1, latentChannels, latentSize, latentSize])],
    [SymbolicTensor('float32', [1, 3, imageSize, imageSize])]
  );

  const latentNumel = latentChannels * latentSize * latentSize;

  const tensors = [
    tensor('int64', [1, CLIP_MAX_TOKENS]),
    tensor('float32', [1, CLIP_MAX_TOKENS, CLIP_HIDDEN_SIZE]),
    tensor('int64', [1]),
    tensor('float32', [1, latentChannels, latentSize, latentSize]),
    tensor('float32', [1, latentChannels, latentSize, latentSize]),
    tensor('float32', [1, 3, imageSize, imageSize]),
    tensor('float32', [3, imageSize, imageSize]),
    tensor('uint8', [3, imageSize, imageSize]),
    tensor('uint8', [imageSize, imageSize, 3]),
    tensor('uint8', [imageSize, imageSize, 4]),
  ] as const;

  const [
    tTokens,
    tEmbeddings,
    tTimestep,
    tLatents,
    tNoisePred,
    tDecoded,
    tReshape,
    tUint8,
    tChanLast,
    tRgba,
  ] = tensors;

  const dispose = () => {
    tensors.forEach((t) => t.dispose());
    tokenizer.dispose();
    model.dispose();
  };

  const generateWorklet = (prompt: string, seed: number): ImageBuffer => {
    'worklet';

    tTokens.setData(encodePrompt(tokenizer.encode(prompt)));
    model.execute('encode', [tTokens], [tEmbeddings]);

    const noise = seededGaussian(latentNumel, seed);
    for (let i = 0; i < latentNumel; i++) noise[i]! *= opts.initNoiseSigma;
    tLatents.setData(noise);

    tTimestep.setData(new BigInt64Array([BigInt(opts.timestep)]));
    for (let step = 0; step < opts.numInferenceSteps; step++) {
      model.execute('denoise', [tLatents, tTimestep, tEmbeddings], [tNoisePred]);
      const latents = tLatents.getData(new Float32Array(latentNumel));
      const modelOutput = tNoisePred.getData(new Float32Array(latentNumel));
      tLatents.setData(toCleanLatents(latents, modelOutput, opts));
    }

    model.execute('decode', [tLatents], [tDecoded]);

    const data = new Uint8Array(imageSize * imageSize * 4);
    tDecoded
      .copyTo(tReshape)
      .through(normalize, tUint8, { alpha: opts.outAlpha, beta: opts.outBeta })
      .through(toChannelsLast, tChanLast)
      .through(cvtColor, tRgba, 'RGB2RGBA')
      .getData(data);

    return { data, width: imageSize, height: imageSize, format: 'rgba', layout: 'hwc' };
  };

  const generate = wrapAsync(generateWorklet, runtime);

  return { generate, generateWorklet, dispose };
}
