/**
 * Reverb Text-to-Speech (TTS) synthesis task pipeline.
 */

import type { WorkletRuntime } from 'react-native-worklets';

import RNBlobUtil from 'react-native-blob-util';

import { tensor, type Tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import {
  validateSpec,
  method,
  i64,
  f16,
  f32,
  DynamicDim as Dyn,
  constraint,
  type DimRef,
  type Range,
} from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';
import { createResourceScope } from '../../../core/lifetime';
import { RnExecuTorchError } from '../../../core/error';
import { mulberry32 } from '../../math';
import { loadTokenizer } from '../../nlp/tokenizer';
import { partitionReverbText } from '../utils/reverbPartitioner';
import {
  buildPrompt,
  estimateTargetFrames,
  parseVoice,
  pauseAfter,
  prepareText,
  roundHalfEven,
  trimSilence,
} from '../utils/reverbUtils';

/**
 * Reverb audio sampling rate in Hz (24000).
 * @category Speech / Constants
 */
export const REVERB_SAMPLE_RATE = 24000;

/**
 * Codec frames per second (25).
 * @category Speech / Constants
 */
export const REVERB_FRAME_RATE = 25;

/**
 * Languages Reverb speaks.
 * @category Speech / Constants
 */
export const REVERB_LANGUAGES = ['de', 'en', 'es', 'fr', 'it', 'pl', 'pt'] as const;

const FRAME_SAMPLES = REVERB_SAMPLE_RATE / REVERB_FRAME_RATE; // 960
const CODEBOOKS = 8;
const CODES = 1024; // per codebook; the next id marks a masked slot
const MASK_CODE = BigInt(CODES);
// K/V cache: [keys and values, layers, KV heads, prefix, head dim]
const CACHE_LAYERS = 24;
const CACHE_HEADS = 6;
const CACHE_HEAD_DIM = 128;

// Voice Studio's sampler
const T_SHIFT = 0.1; // few commits early, most in the last passes
const CODEBOOK_PENALTY = 5; // per codebook index: codebook 0 commits before 1
const POSITION_TEMPERATURE = 5; // scales confidence and penalty against the Gumbel noise
const DEFAULT_STEPS = 8;
const DEFAULT_REMASK_RATIO = 0.25;

const MIN_FRAMES = 10;
const DEFAULT_SPEED = 1.0;
const MIN_SPEED = 0.5;
const MAX_SPEED = 2.0;
const DEFAULT_MAX_CHUNK_DURATION = 20;
const DEFAULT_POSTPROCESS = { endCut: 0.2, silenceThreshold: -50, keep: 0.1 };

/**
 * A language Reverb speaks.
 * @category Speech / Types
 */
export type ReverbLanguage = (typeof REVERB_LANGUAGES)[number];

/**
 * A voice to speak in: a reference clip's codec codes and transcript.
 * @category Speech / Types
 */
export type ReverbVoice = {
  /** Codec codes, `[8, frames]` row-major. */
  readonly codes: BigInt64Array;
  /** What the clip says, verbalized and normalized. */
  readonly transcript: string;
  /** The clip's language. */
  readonly language: ReverbLanguage;
};

/**
 * Model configuration of the Reverb Text-to-Speech pipeline.
 * @category Speech / Types
 * @typeParam K Preset voice keys.
 */
export type ReverbTtsModel<K extends PropertyKey = never> = {
  /** Discriminates this config from the other Text-to-Speech pipelines. */
  readonly name: 'reverb';
  /** Local or remote paths to the `.pte` programs. */
  readonly modelPaths: {
    /** The backbone: `prefill`, `step`, `polish`. */
    readonly backbone: string;
    /** The codec decoder: codes to audio. */
    readonly codecDecoder: string;
    /** The codec encoder: audio to codes. Only `encodeVoice` loads it. */
    readonly codecEncoder?: string;
  };
  /** Local or remote path to `tokenizer.json`. */
  readonly tokenizerPath: string;
  /** Preset voices: name to `{ codes, transcript, language }` JSON file. */
  readonly voices?: Record<K, string>;
};

/**
 * Sampler settings; the defaults are the measured ones.
 * @category Speech / Types
 */
export type ReverbSamplingOptions = {
  /** Main passes. Defaults to 8.
   * NOTE: total number of steps (including polish pass) is always N + 2 */
  readonly steps?: number;
  /** Held codes re-masked per new commit, in `[0, 1]`. Defaults to 0.25. */
  readonly remaskRatio?: number;
  /** Integer seed for reproducible takes. Random by default. */
  readonly seed?: number;
};

/**
 * Per-chunk post-processing; the defaults are Voice Studio's.
 * @category Speech / Types
 */
export type ReverbPostprocessOptions = {
  /** Seconds cut from the end. Defaults to 0.2. */
  readonly endCut?: number;
  /** Level in dBFS below which an edge window is silent. Defaults to -50. */
  readonly silenceThreshold?: number;
  /** Seconds of silence kept at each edge. Defaults to 0.1. */
  readonly keep?: number;
};

/**
 * Per-call options of Reverb synthesis.
 * @category Speech / Types
 * @typeParam K Preset voice keys.
 */
export type ReverbTtsOptions<K extends PropertyKey = never> = {
  /** A preset voice key, or a {@link ReverbVoice} from `encodeVoice`. */
  readonly voice: K | ReverbVoice;
  /** Language of the text. */
  readonly language: ReverbLanguage;
  /** Speech speed factor, 0.5 to 2.0. Defaults to 1.0. */
  readonly speed?: number;
  /** Max seconds of speech per chunk. Defaults to 20. */
  readonly maxChunkDuration?: number;
  /** Post-processing, or `false` for the raw decoder output. */
  readonly postprocess?: ReverbPostprocessOptions | false;
  /** Sampler settings. */
  readonly sampling?: ReverbSamplingOptions;
};

/**
 * Audio chunk yielded by {@link ReverbTextToSpeech.synthesize}.
 * @category Speech / Types
 */
export type ReverbTtsChunk = {
  /** Float32 PCM samples in `[-1, 1]`. */
  readonly audio: Float32Array;
  /** Sampling rate in Hz. */
  readonly sampleRate: number;
  /** Duration in seconds. */
  readonly duration: number;
  /** Zero-based index of this chunk. */
  readonly chunkIndex: number;
  /** Number of chunks the text was split into. */
  readonly totalChunks: number;
};

/**
 * Reverb text-to-speech task runner.
 * @category Speech / Types
 * @typeParam K Preset voice keys.
 */
export type ReverbTextToSpeech<K extends PropertyKey = never> = {
  /** Releases all native resources. */
  readonly dispose: () => void;

  /**
   * Encodes a recording into a voice, loading the codec encoder on first use.
   * @param audio 24 kHz mono PCM, 1 to 20 s.
   * @param transcript What the recording says.
   * @param language The recording's language.
   * @returns The voice.
   * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` on a bad argument,
   * `INVALID_STATE` without a codec encoder, or `RESOURCE_DISPOSED` if
   * disposed.
   */
  readonly encodeVoice: (
    audio: Float32Array,
    transcript: string,
    language: ReverbLanguage
  ) => Promise<ReverbVoice>;

  /**
   * Streams synthesized audio, one chunk of text at a time.
   * @param text The text to speak.
   * @param options See {@link ReverbTtsOptions}.
   * @returns An AsyncGenerator of {@link ReverbTtsChunk}s.
   * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` on a bad argument,
   * `INVALID_STATE` if a synthesis is running, `RESOURCE_BUSY` if the model is
   * in use, or `RESOURCE_DISPOSED` if disposed.
   */
  readonly synthesize: (
    text: string,
    options: ReverbTtsOptions<K>
  ) => AsyncGenerator<ReverbTtsChunk>;

  /** Cancels an in-flight synthesis. */
  readonly synthesizeStop: () => void;
};

const frameDim = (paramSide: 'input' | 'output', tensorIdx: number, dimIdx = 1): DimRef => ({
  paramSide,
  tensorIdx,
  dimIdx,
});
const cache = () => f16(2, CACHE_LAYERS, CACHE_HEADS, Dyn('P'), CACHE_HEAD_DIM);

// prettier-ignore
const BACKBONE_SPEC = {
  ...method(
    'prefill',
    [i64(Dyn('L')), i64(CODEBOOKS, Dyn('R'))], // prompt tokens, reference codes
    [cache()]
  ),
  ...method(
    'step',
    [i64(CODEBOOKS, Dyn('T')), cache()], // tokens
    [f32(2, Dyn('T')), i64(2, Dyn('T')), f32(2, Dyn('T'))], // confidence, prediction, held
    [constraint.equality(frameDim('input', 0), frameDim('output', 0), frameDim('output', 1), frameDim('output', 2))]
  ),
  ...method(
    'polish',
    [i64(CODEBOOKS, Dyn('T')), i64(1), cache()], // tokens, reference frames
    [i64(CODEBOOKS - 2, Dyn('T'))], // codebooks 2-7
    [constraint.equality(frameDim('input', 0), frameDim('output', 0))]
  ),
};

const DECODER_SPEC = method(
  'forward',
  [i64(CODEBOOKS, Dyn('T'))], // codes
  [f32(Dyn('Samples'))], // audio
  [constraint.linear(frameDim('output', 0, 0), frameDim('input', 0), FRAME_SAMPLES)]
);

const ENCODER_SPEC = method(
  'forward',
  [f32(Dyn('F'), FRAME_SAMPLES)], // audio, one row per frame
  [i64(CODEBOOKS, Dyn('F'))], // codes
  [constraint.equality(frameDim('input', 0, 0), frameDim('output', 0))]
);

// Cumulative share of the slots committed after each main pass, from 0 to 1.
function commitSchedule(steps: number): number[] {
  'worklet';
  const schedule: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    schedule.push((T_SHIFT * t) / (1 - (1 - T_SHIFT) * t));
  }
  return schedule;
}

// One main pass over codebooks 0-1 of `tokens`, in place: commits the pass's share of the masked slots by
// Gumbel-perturbed confidence, then, except on the last pass, re-masks the least likely codes held before it.
function samplePass(
  tokens: BigInt64Array,
  frames: number,
  pass: { confidence: Float32Array; prediction: BigInt64Array; held: Float32Array },
  step: number,
  schedule: readonly number[],
  remaskRatio: number,
  random: () => number
): void {
  'worklet';
  const slots = 2 * frames;
  const last = step === schedule.length - 2;
  const score = new Float64Array(slots);
  const masked: number[] = [];
  const held: number[] = [];
  for (let i = 0; i < slots; i++) {
    const gumbel = -Math.log(-Math.log(random() + 1e-10) + 1e-10);
    if (tokens[i] !== MASK_CODE) {
      held.push(i);
      continue;
    }
    const penalty = CODEBOOK_PENALTY * Math.floor(i / frames);
    score[i] = (pass.confidence[i]! - penalty) / POSITION_TEMPERATURE + gumbel;
    masked.push(i);
  }

  const share = Math.ceil(slots * (schedule[step + 1]! - schedule[step]!));
  const count = last ? masked.length : Math.min(masked.length, share);
  masked.sort((a, b) => score[b]! - score[a]!);
  for (const i of masked.slice(0, count)) tokens[i] = pass.prediction[i]!;

  if (last || remaskRatio <= 0) return;
  held.sort((a, b) => pass.held[a]! - pass.held[b]!);
  for (const i of held.slice(0, roundHalfEven(remaskRatio * count))) tokens[i] = MASK_CODE;
}

/**
 * Creates a Reverb Text-to-Speech pipeline: speech in the voice of a short
 * recording, in 7 languages.
 * @category Speech / Tasks
 * @typeParam K Preset voice keys (inferred from `config.voices`).
 * @param config Paths to the programs, tokenizer, and voices. See
 * {@link ReverbTtsModel}.
 * @param runtime Optional worklet runtime to run inference on.
 * @returns The {@link ReverbTextToSpeech} runner.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if an asset fails to
 * load, or `SCHEMA_MISMATCH` if a program does not match Reverb's.
 */
export async function createReverbTextToSpeech<K extends PropertyKey = never>(
  config: ReverbTtsModel<K>,
  runtime?: WorkletRuntime
): Promise<ReverbTextToSpeech<K>> {
  const scope = createResourceScope();
  let disposed = false;
  const dispose = (): void => {
    disposed = true;
    scope.dispose();
  };

  try {
    const load = wrapAsync(loadModel, runtime);
    const backbone = scope.track(await load(config.modelPaths.backbone));
    const decoder = scope.track(await load(config.modelPaths.codecDecoder));
    const tokenizer = scope.track(await wrapAsync(loadTokenizer, runtime)(config.tokenizerPath));

    const backboneSpec = validateSpec(backbone.schema, { default: BACKBONE_SPEC });
    const [promptTokens, referenceFrames, targetFrames] = backboneSpec.dims.range('L', 'R', 'T');
    const [decodedFrames] = validateSpec(decoder.schema, { default: DECODER_SPEC }).dims.range('T');
    const minFrames = Math.max(MIN_FRAMES, targetFrames.min, decodedFrames.min);
    const maxFrames = Math.min(targetFrames.max, decodedFrames.max);

    // A voice the programs take: [8, frames] codes in range, a transcript, and a supported language.
    const validateVoice = (
      voice: ReverbVoice,
      code: 'INVALID_ARGUMENT' | 'LOAD_FAILED',
      ctx: string
    ): ReverbVoice => {
      const frames = voice.codes.length / CODEBOOKS;
      const valid =
        Number.isInteger(frames) &&
        frames >= referenceFrames.min &&
        frames <= referenceFrames.max &&
        voice.codes.every((c) => c >= 0n && c < MASK_CODE) &&
        voice.transcript.trim().length > 0 &&
        REVERB_LANGUAGES.includes(voice.language);
      if (!valid) {
        throw RnExecuTorchError(
          code,
          `${ctx}: A voice holds [${CODEBOOKS}, frames] codes below ${CODES}, with ` +
            `${referenceFrames.min} to ${referenceFrames.max} frames, a transcript, and a ` +
            `supported language.`
        );
      }
      return voice;
    };

    const voices = {} as Record<K, ReverbVoice>;
    for (const [key, path] of Object.entries(config.voices ?? {}) as [K, string][]) {
      const json = JSON.parse(await RNBlobUtil.fs.readFile(path, 'utf8'));
      voices[key] = validateVoice(parseVoice(json), 'LOAD_FAILED', `Voice '${String(key)}'`);
    }

    const synthesizeChunkWorklet = (
      ids: Int32Array,
      voice: ReverbVoice,
      frames: number,
      chunkOpts: {
        steps: number;
        remaskRatio: number;
        seed: number;
        postprocess: Required<ReverbPostprocessOptions> | false;
        pause: number;
      }
    ): Float32Array => {
      'worklet';

      const { steps, remaskRatio, seed, postprocess, pause } = chunkOpts;
      const references = voice.codes.length / CODEBOOKS;
      const slots = 2 * frames;
      const tokens = new BigInt64Array(CODEBOOKS * frames).fill(MASK_CODE);
      const pass = {
        confidence: new Float32Array(slots),
        prediction: new BigInt64Array(slots),
        held: new Float32Array(slots),
      };
      const schedule = commitSchedule(steps);
      const random = mulberry32(seed);

      // Collect execution tensors for cleanup in a single try/finally block
      const auxTensors: Tensor[] = [];
      const alloc = (...args: Parameters<typeof tensor>): Tensor => {
        const t = tensor(...args);
        auxTensors.push(t);
        return t;
      };

      try {
        // 1. Prefill the prompt and the reference into the K/V cache
        const tCache = alloc('float16', [
          2,
          CACHE_LAYERS,
          CACHE_HEADS,
          ids.length + references,
          CACHE_HEAD_DIM,
        ]);
        const tIds = alloc('int64', [ids.length], BigInt64Array.from(ids, BigInt));
        const tReference = alloc('int64', [CODEBOOKS, references], voice.codes);
        backbone.execute('prefill', [tIds, tReference], [tCache]);

        // 2. Main passes over codebooks 0-1
        const tTokens = alloc('int64', [CODEBOOKS, frames]);
        const tConfidence = alloc('float32', [2, frames]);
        const tPrediction = alloc('int64', [2, frames]);
        const tHeld = alloc('float32', [2, frames]);
        for (let step = 0; step < steps; step++) {
          tTokens.setData(tokens);
          backbone.execute('step', [tTokens, tCache], [tConfidence, tPrediction, tHeld]);
          tConfidence.getData(pass.confidence);
          tPrediction.getData(pass.prediction);
          tHeld.getData(pass.held);
          samplePass(tokens, frames, pass, step, schedule, remaskRatio, random);
        }

        // 3. Polish codebooks 2-7
        const tReferenceFrames = alloc('int64', [1], BigInt64Array.of(BigInt(references)));
        const tFine = alloc('int64', [CODEBOOKS - 2, frames]);
        tTokens.setData(tokens);
        backbone.execute('polish', [tTokens, tReferenceFrames, tCache], [tFine]);
        tokens.set(tFine.getData(new BigInt64Array((CODEBOOKS - 2) * frames)), slots);

        // 4. Decode
        const tAudio = alloc('float32', [frames * FRAME_SAMPLES]);
        tTokens.setData(tokens);
        decoder.execute('forward', [tTokens], [tAudio]);
        let audio: Float32Array = tAudio.getData(new Float32Array(frames * FRAME_SAMPLES));

        // 5. Cut the end, then trim the silent edges
        if (postprocess) {
          const { endCut, silenceThreshold, keep } = postprocess;
          const end = Math.max(0, audio.length - Math.floor(endCut * REVERB_SAMPLE_RATE));
          audio = trimSilence(audio.subarray(0, end), REVERB_SAMPLE_RATE, silenceThreshold, keep);
        }

        // 6. Append the pause the chunk's final punctuation calls for
        const result = new Float32Array(audio.length + Math.round(pause * REVERB_SAMPLE_RATE));
        result.set(audio);
        return result;
      } finally {
        auxTensors.forEach((t) => t.dispose());
      }
    };

    const synthesizeChunk = wrapAsync(synthesizeChunkWorklet, runtime);

    const checkLanguage = (language: unknown, ctx: string): void => {
      if (!REVERB_LANGUAGES.includes(language as ReverbLanguage)) {
        throw RnExecuTorchError(
          'INVALID_ARGUMENT',
          `${ctx}: Unsupported language: ${String(language)}.`
        );
      }
    };

    const resolveVoice = (voice: K | ReverbVoice): ReverbVoice => {
      const resolved = typeof voice === 'object' ? voice : voices[voice];
      if (!resolved) {
        throw RnExecuTorchError('INVALID_ARGUMENT', `synthesize: Unknown voice: ${String(voice)}.`);
      }
      return validateVoice(resolved, 'INVALID_ARGUMENT', 'synthesize');
    };

    let encoder:
      | Promise<{ encode: (audio: Float32Array) => Promise<BigInt64Array>; frames: Range }>
      | undefined;
    const loadEncoder = async () => {
      if (!config.modelPaths.codecEncoder) {
        throw RnExecuTorchError('INVALID_STATE', 'encodeVoice: The config names no codecEncoder.');
      }
      const model = await load(config.modelPaths.codecEncoder);
      try {
        if (disposed) {
          throw RnExecuTorchError('RESOURCE_DISPOSED', 'encodeVoice: The pipeline was disposed.');
        }
        const [frames] = validateSpec(model.schema, { default: ENCODER_SPEC }).dims.range('F');
        scope.track(model);
        const encodeWorklet = (audio: Float32Array): BigInt64Array => {
          'worklet';
          const count = audio.length / FRAME_SAMPLES;
          const tAudio = tensor('float32', [count, FRAME_SAMPLES], audio);
          const tCodes = tensor('int64', [CODEBOOKS, count]);
          try {
            model.execute('forward', [tAudio], [tCodes]);
            return tCodes.getData(new BigInt64Array(CODEBOOKS * count));
          } finally {
            tAudio.dispose();
            tCodes.dispose();
          }
        };
        return { encode: wrapAsync(encodeWorklet, runtime), frames };
      } catch (error) {
        model.dispose();
        throw error;
      }
    };

    const encodeVoice = async (
      audio: Float32Array,
      transcript: string,
      language: ReverbLanguage
    ): Promise<ReverbVoice> => {
      if (disposed) {
        throw RnExecuTorchError('RESOURCE_DISPOSED', 'encodeVoice: The pipeline was disposed.');
      }
      checkLanguage(language, 'encodeVoice');
      if (!transcript.trim()) {
        throw RnExecuTorchError('INVALID_ARGUMENT', 'encodeVoice: The transcript cannot be empty.');
      }
      encoder ??= loadEncoder().catch((error) => {
        encoder = undefined;
        throw error;
      });
      const { encode, frames } = await encoder;

      const count = Math.floor(audio.length / FRAME_SAMPLES);
      const min = Math.max(frames.min, referenceFrames.min);
      const max = Math.min(frames.max, referenceFrames.max);
      if (count < min || count > max) {
        throw RnExecuTorchError(
          'INVALID_ARGUMENT',
          `encodeVoice: The audio must last ${min / REVERB_FRAME_RATE} to ` +
            `${max / REVERB_FRAME_RATE} s at ${REVERB_SAMPLE_RATE} Hz ` +
            `(got ${audio.length / REVERB_SAMPLE_RATE} s).`
        );
      }
      const codes = await encode(audio.slice(0, count * FRAME_SAMPLES));

      return { codes, transcript: prepareText(transcript, language), language };
    };

    let isSynthesizing = false;
    const synthesizeStop = (): void => {
      isSynthesizing = false;
    };

    async function* synthesize(
      text: string,
      options: ReverbTtsOptions<K>
    ): AsyncGenerator<ReverbTtsChunk> {
      if (isSynthesizing) {
        throw RnExecuTorchError('INVALID_STATE', 'synthesize: Synthesis is already in progress.');
      }

      if (!text || !text.trim()) {
        throw RnExecuTorchError('INVALID_ARGUMENT', 'synthesize: Input text cannot be empty.');
      }

      const { language } = options;
      checkLanguage(language, 'synthesize');
      const voice = resolveVoice(options.voice);
      const references = voice.codes.length / CODEBOOKS;

      const speed = options.speed ?? DEFAULT_SPEED;
      if (!(speed >= MIN_SPEED && speed <= MAX_SPEED)) {
        throw RnExecuTorchError(
          'INVALID_ARGUMENT',
          `synthesize: speed must be between ${MIN_SPEED} and ${MAX_SPEED}.`
        );
      }

      // A chunk at the limit must still fit the backbone's target window.
      const maxChunkDuration = options.maxChunkDuration ?? DEFAULT_MAX_CHUNK_DURATION;
      const maxDuration = maxFrames / REVERB_FRAME_RATE;
      if (!(maxChunkDuration > 0 && maxChunkDuration <= maxDuration)) {
        throw RnExecuTorchError(
          'INVALID_ARGUMENT',
          `synthesize: maxChunkDuration must be above 0 and at most ${maxDuration} s.`
        );
      }

      const steps = options.sampling?.steps ?? DEFAULT_STEPS;
      const remaskRatio = options.sampling?.remaskRatio ?? DEFAULT_REMASK_RATIO;
      const seed = options.sampling?.seed ?? Math.floor(Math.random() * 0x100000000);
      if (!Number.isInteger(steps) || steps <= 0) {
        throw RnExecuTorchError(
          'INVALID_ARGUMENT',
          'synthesize: steps must be a positive integer.'
        );
      }
      if (!(remaskRatio >= 0 && remaskRatio <= 1)) {
        throw RnExecuTorchError('INVALID_ARGUMENT', 'synthesize: remaskRatio must be in [0, 1].');
      }
      if (!Number.isInteger(seed)) {
        throw RnExecuTorchError('INVALID_ARGUMENT', 'synthesize: seed must be an integer.');
      }
      const postprocess =
        options.postprocess === false
          ? false
          : {
              endCut: options.postprocess?.endCut ?? DEFAULT_POSTPROCESS.endCut,
              silenceThreshold:
                options.postprocess?.silenceThreshold ?? DEFAULT_POSTPROCESS.silenceThreshold,
              keep: options.postprocess?.keep ?? DEFAULT_POSTPROCESS.keep,
            };

      const encodePrompt = (chunk: string) =>
        tokenizer.encode(buildPrompt(language, voice.transcript, chunk));
      if (encodePrompt('').length >= promptTokens.max) {
        throw RnExecuTorchError(
          'INVALID_ARGUMENT',
          `synthesize: The voice's transcript leaves no room for text in the ` +
            `${promptTokens.max}-token prompt.`
        );
      }
      const targetLength = (chunk: string) =>
        estimateTargetFrames(chunk, voice.transcript, references) / speed;

      isSynthesizing = true;
      try {
        const chunks = partitionReverbText(
          prepareText(text, language),
          (chunk) => targetLength(chunk) / REVERB_FRAME_RATE,
          {
            maxDuration: maxChunkDuration,
            fits: (chunk) => encodePrompt(chunk).length <= promptTokens.max,
          }
        );

        for (const [chunkIndex, chunk] of chunks.entries()) {
          if (!isSynthesizing) break;

          const ids = encodePrompt(chunk);
          if (ids.length > promptTokens.max) {
            throw RnExecuTorchError(
              'INVALID_ARGUMENT',
              `synthesize: "${chunk}" does not fit the ${promptTokens.max}-token prompt.`
            );
          }
          const frames = Math.min(
            Math.max(roundHalfEven(targetLength(chunk)), minFrames),
            maxFrames
          );
          const audio = await synthesizeChunk(ids, voice, frames, {
            steps,
            remaskRatio,
            seed: seed + chunkIndex,
            postprocess,
            pause: pauseAfter(chunk),
          });
          yield {
            audio,
            sampleRate: REVERB_SAMPLE_RATE,
            duration: audio.length / REVERB_SAMPLE_RATE,
            chunkIndex,
            totalChunks: chunks.length,
          };
        }
      } finally {
        isSynthesizing = false;
      }
    }

    return { dispose, encodeVoice, synthesize, synthesizeStop };
  } catch (error) {
    dispose();
    throw error;
  }
}
