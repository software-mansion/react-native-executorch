/**
 * Supertonic Text-to-Speech (TTS) synthesis task pipeline.
 * @module Speech/Tasks/SupertonicTextToSpeech
 */

import type { WorkletRuntime } from 'react-native-worklets';

import RNBlobUtil from 'react-native-blob-util';

import { tensor, type Tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateSpec, method, i64, f32, DynamicDim as Dyn, constr } from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';
import { randomNormal } from '../../math';
import {
  cleanText,
  formatChunk,
  encodeText,
  parseVoiceStyle,
  SUPERTONIC_SUPPORTED_LANGUAGES,
  type SupertonicVoiceStyle,
  type SupertonicLanguage,
} from '../utils/supertonicUtils';
import { partition } from '../utils/textPartitioner';
import { RnExecuTorchError } from '../../../core/error';

export { SUPERTONIC_SUPPORTED_LANGUAGES, type SupertonicVoiceStyle, type SupertonicLanguage };

/**
 * Supertonic audio sampling rate in Hz (44100).
 * @category Speech / Constants
 */
export const SUPERTONIC_SAMPLE_RATE = 44100;

// Audio & Model Tensor Dimensions / Shapes
const BASE_CHUNK_SIZE = 512; // vocoder decompresses each latent frame into this many audio samples
const CHUNK_COMPRESS_FACTOR = 6; // latent frames packed per chunk
const CHUNK_SIZE = BASE_CHUNK_SIZE * CHUNK_COMPRESS_FACTOR; // 3072 audio samples per latent step

const LATENT_DIM = 24 * CHUNK_COMPRESS_FACTOR; // 144 — latent channels
const TEXT_EMB_DIM = 256;
const STYLE_DP_SHAPE = [1, 8, 16] as const; // duration predictor style: 8 prototypes × 16 dims
const STYLE_TTL_SHAPE = [1, 50, 256] as const; // text-to-latent style: 50 tokens × 256 dims

// Synthesis Execution Defaults & Boundaries
const DEFAULT_TOTAL_STEPS = 8;
const DEFAULT_SPEED = 1.05;
const MIN_SPEED = 0.8;
const MAX_SPEED = 1.2;
const MAX_CHUNK_LENGTH_CAP = 240;

function getDefaultMaxChunkLength(lang?: SupertonicLanguage): number {
  switch (lang) {
    case 'ko':
      return 120;
    case 'ja':
      return 120;
    default:
      return MAX_CHUNK_LENGTH_CAP;
  }
}

/**
 * Model configuration required to instantiate the Supertonic Text-to-Speech
 * pipeline.
 * @category Speech / Types
 * @typeParam K Voice style keys record constraint (strictly inferred from
 * voiceStyles keys).
 */
export type SupertonicTtsModel<K extends PropertyKey> = {
  /** Discriminates this config from the other Text-to-Speech pipelines. */
  readonly name: 'supertonic';
  /** Local or remote file paths to the 4 Supertonic `.pte` sub-models. */
  readonly modelPaths: {
    /** Path to the duration predictor `.pte` model. */
    readonly durationPredictor: string;
    /** Path to the vector estimator `.pte` model. */
    readonly vectorEstimator: string;
    /** Path to the text encoder `.pte` model. */
    readonly textEncoder: string;
    /** Path to the vocoder `.pte` model. */
    readonly vocoder: string;
  };
  /** Local or remote path to the `unicode_indexer.json` character mapping file. */
  readonly unicodeIndexerPath: string;
  /** Map of voice style names to local or remote JSON file paths. */
  readonly voiceStyles: Record<K, string>;
};

/**
 * Per-call execution options for Supertonic Text-to-Speech synthesis.
 * @category Speech / Types
 * @typeParam K Voice style keys record constraint.
 */
export type SupertonicTtsOptions<K extends PropertyKey> = {
  /**
   * Voice style key matching one of the keys in `config.voiceStyles`, or a raw
   * {@link SupertonicVoiceStyle} object.
   */
  readonly voiceStyle: K | SupertonicVoiceStyle;
  /** Speech speed factor (range: 0.8 to 1.2). */
  readonly speed?: number;
  /** Number of flow-matching denoising steps. */
  readonly totalSteps?: number;
  /** Language ISO code (e.g. 'en', 'ko', 'es', 'na'). */
  readonly lang?: SupertonicLanguage;
  /** Maximum character limit per text chunk. */
  readonly maxChunkLength?: number;
};

/**
 * Audio output chunk yielded by the {@link createSupertonicTextToSpeech} generator.
 * @category Speech / Types
 */
export type SupertonicTtsChunk = {
  /** Float32 PCM audio samples for this chunk, normalized in `[-1, 1]`. */
  readonly audio: Float32Array;
  /** Audio sampling rate in Hz (see {@link SUPERTONIC_SAMPLE_RATE}). */
  readonly sampleRate: number;
  /** Estimated duration of this audio chunk in seconds. */
  readonly duration: number;
  /** Zero-based index of this chunk. */
  readonly chunkIndex: number;
  /** Total number of text chunks partitioned from the input text. */
  readonly totalChunks: number;
};

/**
 * Supertonic text-to-speech task runner.
 * @category Speech / Types
 * @typeParam K Voice style keys record constraint.
 */
export type SupertonicTextToSpeech<K extends PropertyKey = string> = {
  /** Releases all allocated native models and static execution tensors. */
  readonly dispose: () => void;

  /**
   * Streams synthesized audio chunks as an async generator as each text chunk
   * finishes.
   * @param text Input text string to synthesize into speech.
   * @param options Per-call execution options.
   * See {@link SupertonicTtsOptions}.
   * @returns An AsyncGenerator yielding {@link SupertonicTtsChunk} audio
   * buffers.
   * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if voice style is
   * invalid or language is unsupported, `RESOURCE_BUSY` if the model is in use,
   * or `RESOURCE_DISPOSED` if disposed.
   */
  readonly synthesize: (
    text: string,
    options: SupertonicTtsOptions<K>
  ) => AsyncGenerator<SupertonicTtsChunk>;

  /** Cancels any in-flight synthesis started by {@link synthesize}. */
  readonly synthesizeStop: () => void;
};

/**
 * Creates a Supertonic Text-to-Speech pipeline.
 *
 * It validates all 4 sub-model method schemas, pre-allocates static execution
 * tensors, pre-parses voice styles into memory, and registers disposal hooks to
 * release all native resources.
 * @category Speech / Tasks
 * @typeParam K Voice style keys record constraint.
 * @param config Supertonic TTS pipeline configuration containing model and asset paths.
 * See {@link SupertonicTtsModel}.
 * @param runtime Optional worklet runtime thread on which to run inference.
 * @returns A promise resolving to the instantiated {@link SupertonicTextToSpeech}
 * runner.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if models, indexer, or
 * voice styles fail to load, or `SCHEMA_MISMATCH` if model schemas do not match
 * the Supertonic specification.
 */
export async function createSupertonicTextToSpeech<K extends PropertyKey>(
  config: SupertonicTtsModel<K>,
  runtime?: WorkletRuntime
): Promise<SupertonicTextToSpeech<K>> {
  const load = wrapAsync(loadModel, runtime);
  const [durationPredictor, vectorEstimator, textEncoder, vocoder] = await Promise.all([
    load(config.modelPaths.durationPredictor),
    load(config.modelPaths.vectorEstimator),
    load(config.modelPaths.textEncoder),
    load(config.modelPaths.vocoder),
  ]);
  const models = { durationPredictor, textEncoder, vectorEstimator, vocoder };

  validateSpec(models.durationPredictor.schema, {
    default: method(
      'forward',
      [
        i64(1, Dyn('T')), // textIds
        f32(...STYLE_DP_SHAPE), // styleDp
        f32(1, 1, Dyn('T')), // textMask
      ],
      [f32(1)], // duration
      [
        constr.eq(
          { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
          { paramSide: 'input', tensorIdx: 2, dimIdx: 2 }
        ),
      ]
    ),
  });

  validateSpec(models.textEncoder.schema, {
    default: method(
      'forward',
      [
        i64(1, Dyn('T')), // textIds
        f32(...STYLE_TTL_SHAPE), // styleTtl
        f32(1, 1, Dyn('T')), // textMask
      ],
      [f32(1, TEXT_EMB_DIM, Dyn('T'))], // textEmb
      [
        constr.eq(
          { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
          { paramSide: 'input', tensorIdx: 2, dimIdx: 2 },
          { paramSide: 'output', tensorIdx: 0, dimIdx: 2 }
        ),
      ]
    ),
  });

  validateSpec(models.vectorEstimator.schema, {
    default: method(
      'forward',
      [
        f32(1, LATENT_DIM, Dyn('L')), // noisyLatent
        f32(1, TEXT_EMB_DIM, Dyn('T')), // textEmb
        f32(...STYLE_TTL_SHAPE), // styleTtl
        f32(1, 1, Dyn('T')), // textMask
        f32(1, 1, Dyn('L')), // latentMask
        f32(1), // currentStep
        f32(1), // totalStep
      ],
      [f32(1, LATENT_DIM, Dyn('L'))], // denoisedLatent
      [
        constr.eq(
          { paramSide: 'input', tensorIdx: 0, dimIdx: 2 },
          { paramSide: 'input', tensorIdx: 4, dimIdx: 2 },
          { paramSide: 'output', tensorIdx: 0, dimIdx: 2 }
        ),
        constr.eq(
          { paramSide: 'input', tensorIdx: 1, dimIdx: 2 },
          { paramSide: 'input', tensorIdx: 3, dimIdx: 2 }
        ),
      ]
    ),
  });

  validateSpec(models.vocoder.schema, {
    default: method(
      'forward',
      [f32(1, LATENT_DIM, Dyn('L'))], // latent
      [f32(1, Dyn('AUDIO_LEN'))], // wav
      [
        constr.linear(
          { paramSide: 'output', tensorIdx: 0, dimIdx: 1 },
          { paramSide: 'input', tensorIdx: 0, dimIdx: 2 },
          CHUNK_SIZE
        ),
      ]
    ),
  });

  // Parse unicode indexer JSON
  const indexStr = await RNBlobUtil.fs.readFile(config.unicodeIndexerPath, 'utf8');
  const indexer: readonly number[] = JSON.parse(indexStr);

  // Pre-parse voice styles map into memory
  const parsedVoiceStyles = {} as Record<K, SupertonicVoiceStyle>;
  for (const [key, path] of Object.entries(config.voiceStyles) as [K, string][]) {
    const jsonStr = await RNBlobUtil.fs.readFile(path, 'utf8');
    parsedVoiceStyles[key] = parseVoiceStyle(JSON.parse(jsonStr));
  }

  const tensors = [
    tensor('float32', [...STYLE_DP_SHAPE]),
    tensor('float32', [...STYLE_TTL_SHAPE]),
    tensor('float32', [1]),
    tensor('float32', [1]),
    tensor('float32', [1]),
  ] as const;

  const [tStyleDp, tStyleTtl, tDuration, tStep, tTotalStep] = tensors;

  const dispose = () => {
    tensors.forEach((t) => t.dispose());
    Object.values(models).forEach((m) => m.dispose());
  };

  const synthesizeChunkWorklet = (
    chunkText: string,
    chunkOpts: { voiceStyle: SupertonicVoiceStyle; speed: number; totalSteps: number }
  ): { audio: Float32Array; sampleRate: number; duration: number } => {
    'worklet';

    const { voiceStyle, speed, totalSteps } = chunkOpts;
    const textIdsData = encodeText(chunkText, indexer);
    const textLen = textIdsData.length;

    // Load style data into static pre-allocated tensors
    tStyleDp.setData(voiceStyle.styleDp);
    tStyleTtl.setData(voiceStyle.styleTtl);

    // Collect dynamic execution tensors for cleanup in a single try/finally block
    const auxTensors: Tensor[] = [];

    try {
      // 1. Predict duration
      const tTextIds = tensor('int64', [1, textLen], textIdsData);
      const tTextMask = tensor('float32', [1, 1, textLen], new Float32Array(textLen).fill(1.0));
      auxTensors.push(tTextIds, tTextMask);

      models.durationPredictor.execute('forward', [tTextIds, tStyleDp, tTextMask], [tDuration]);

      const durationSec = tDuration.getData(new Float32Array(1))[0]! / speed;

      // 2. Encode text
      const tTextEmb = tensor('float32', [1, TEXT_EMB_DIM, textLen]);
      auxTensors.push(tTextEmb);

      models.textEncoder.execute('forward', [tTextIds, tStyleTtl, tTextMask], [tTextEmb]);

      // Calculate latent length from speed-adjusted duration
      const latentLen = Math.max(1, Math.ceil((durationSec * SUPERTONIC_SAMPLE_RATE) / CHUNK_SIZE));

      // 3. Flow-matching denoising loop
      const initialNoise = randomNormal(LATENT_DIM * latentLen);
      const latentMaskData = new Float32Array(latentLen).fill(1.0);

      const tNoisyLatent = tensor('float32', [1, LATENT_DIM, latentLen], initialNoise);
      const tDenoisedLatent = tensor('float32', [1, LATENT_DIM, latentLen]);
      const tLatentMask = tensor('float32', [1, 1, latentLen], latentMaskData);
      const tWav = tensor('float32', [1, CHUNK_SIZE * latentLen]);
      auxTensors.push(tNoisyLatent, tDenoisedLatent, tLatentMask, tWav);

      tTotalStep.setData(new Float32Array([totalSteps]));

      for (let step = 0; step < totalSteps; step++) {
        tStep.setData(new Float32Array([step]));
        models.vectorEstimator.execute(
          'forward',
          [tNoisyLatent, tTextEmb, tStyleTtl, tTextMask, tLatentMask, tStep, tTotalStep],
          [tDenoisedLatent]
        );
        tDenoisedLatent.copyTo(tNoisyLatent);
      }

      // 4. Vocoder waveform generation
      models.vocoder.execute('forward', [tNoisyLatent], [tWav]);

      const audio = tWav.getData(new Float32Array(tWav.numel));

      return {
        audio,
        sampleRate: SUPERTONIC_SAMPLE_RATE,
        duration: audio.length / SUPERTONIC_SAMPLE_RATE,
      };
    } finally {
      auxTensors.forEach((t) => t.dispose());
    }
  };

  const synthesizeChunk = wrapAsync(synthesizeChunkWorklet, runtime);

  let isSynthesizing = false;
  const synthesizeStop = (): void => {
    isSynthesizing = false;
  };

  async function* synthesize(
    text: string,
    options: SupertonicTtsOptions<K>
  ): AsyncGenerator<SupertonicTtsChunk> {
    if (isSynthesizing) {
      throw RnExecuTorchError('INVALID_STATE', 'synthesize: Synthesis is already in progress.');
    }

    if (!text || !text.trim()) {
      throw RnExecuTorchError('INVALID_ARGUMENT', 'synthesize: Input text cannot be empty.');
    }

    const speed = options.speed ?? DEFAULT_SPEED;
    if (speed < MIN_SPEED || speed > MAX_SPEED) {
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        `synthesize: speed must be between ${MIN_SPEED} and ${MAX_SPEED}.`
      );
    }

    const totalSteps = options.totalSteps ?? DEFAULT_TOTAL_STEPS;
    if (!Number.isInteger(totalSteps) || totalSteps <= 0) {
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        'synthesize: totalSteps must be a positive integer.'
      );
    }

    const voiceStyle =
      typeof options.voiceStyle === 'object'
        ? options.voiceStyle
        : parsedVoiceStyles[options.voiceStyle];

    const maxChunkLength = options.maxChunkLength ?? getDefaultMaxChunkLength(options.lang);
    if (maxChunkLength > MAX_CHUNK_LENGTH_CAP) {
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        `synthesize: maxChunkLength cannot exceed ${MAX_CHUNK_LENGTH_CAP}.`
      );
    }

    const cleanedText = cleanText(text);
    const textChunks = partition(cleanedText, maxChunkLength);

    isSynthesizing = true;
    try {
      for (const [chunkIndex, rawChunk] of textChunks.entries()) {
        if (!isSynthesizing) break;

        const textChunk = formatChunk(rawChunk, options.lang);
        const audioChunk = await synthesizeChunk(textChunk, { voiceStyle, speed, totalSteps });
        yield { ...audioChunk, chunkIndex, totalChunks: textChunks.length };
      }
    } finally {
      isSynthesizing = false;
    }
  }

  return { dispose, synthesize, synthesizeStop };
}
