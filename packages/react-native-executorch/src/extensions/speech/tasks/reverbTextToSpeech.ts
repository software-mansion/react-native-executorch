/**
 * Reverb Text-to-Speech (TTS) synthesis task pipeline.
 */

import type { WorkletRuntime } from 'react-native-worklets';

import RNBlobUtil from 'react-native-blob-util';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import {
  validateSpec,
  method,
  i64,
  f32,
  DynamicDim as Dyn,
  constraint,
  type Range,
} from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';
import { createResourceScope } from '../../../core/lifetime';
import { RnExecuTorchError } from '../../../core/error';
import { mulberry32 } from '../../math';
import { loadTokenizer } from '../../nlp/tokenizer';
import {
  CODEBOOKS,
  CODES,
  MASK_CODE,
  createReverbBackbone,
  frameDim,
  type ReverbPass,
} from '../utils/reverbBackbone';
import { partitionReverbText } from '../utils/reverbPartitioner';
import {
  buildPrompt,
  estimateTargetFrames,
  parseVoice,
  pauseAfter,
  prepareText,
  roundHalfEven,
  speechLength,
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

/**
 * Sampler setup.
 *
 * The sampler is a modified version of a standard diffusion masked-language-model,
 * steered with Gumbel noise. It consists of 2 phases:
 * - **Main pass**: fills the first two codebooks of the RVQ codec, which corresponds to content & prosody
 * - **Polish pass**: fills the upper codebooks (2-7), which encode timbre and acoustic details.
 */
const T_SHIFT = 0.1; // few commits early, most in the last passes
const CODEBOOK_PENALTY = 5; // per codebook index: codebook 0 commits before 1
const POSITION_TEMPERATURE = 5; // scales confidence and penalty against the Gumbel noise
const DEFAULT_STEPS = 6; // main passes; the polish pass adds 2 more
const DEFAULT_REMASK_RATIO = 0.25; // held codes re-masked per new commit

const MIN_FRAMES = 10; // shortest take in codec frames, whatever the estimate
const DEFAULT_SPEED = 1.0; // the voice's own pace
const MIN_SPEED = 0.5; // slowest allowed speed factor
const MAX_SPEED = 2.0; // fastest allowed speed factor
const DEFAULT_MAX_CHUNK_DURATION = 20; // max seconds of speech per chunk
const DEFAULT_POSTPROCESS = { enabled: true, endCut: 0.2, silenceThreshold: -50, keep: 0.1 };

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
  /** Frames of the clip spent speaking: without its silent edges, and with pauses over 0.5 s counted as 0.5 s. */
  readonly speechFrames?: number;
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
    /** The backbone: `prefill`, `step` and `polish`, or `prefill` and `step` methods of fixed sizes. */
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
  /**
   * Main passes. Defaults to 6.
   * NOTE: total number of steps (including polish pass) is always N + 2
   */
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
  /** `false` returns the raw decoder output. Defaults to `true`. */
  readonly enabled?: boolean;
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
  /**
   * The way we estimate duration of the output sample.
   * The duration is relative to the reference length, which we can be measured it two ways:
   * `'speech'`: we count only speech frames and inner pauses not longer than 0.5s
   * `'recording'`: we count the whole clip, pauses and prefix/suffix silence included.
   */
  readonly pace?: 'speech' | 'recording';
  /** Max seconds of speech per chunk. Defaults to 20, or to the models' limit when that is shorter. */
  readonly maxChunkDuration?: number;
  /** Post-processing of each chunk's audio. */
  readonly postprocess?: ReverbPostprocessOptions;
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
   * or `INVALID_STATE` without a codec encoder
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
   * `INVALID_STATE` if a synthesis is running, `RESOURCE_BUSY` if the model is in use
   */
  readonly synthesize: (
    text: string,
    options: ReverbTtsOptions<K>
  ) => AsyncGenerator<ReverbTtsChunk>;

  /** Cancels an in-flight synthesis. */
  readonly synthesizeStop: () => void;
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
  pass: ReverbPass,
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
  const dispose = (): void => {
    scope.dispose();
  };

  try {
    const load = wrapAsync(loadModel, runtime);
    const backbone = scope.track(
      createReverbBackbone(scope.track(await load(config.modelPaths.backbone)))
    );
    const decoder = scope.track(await load(config.modelPaths.codecDecoder));
    const tokenizer = scope.track(await wrapAsync(loadTokenizer, runtime)(config.tokenizerPath));

    const { promptTokens, referenceFrames, targetFrames } = backbone.limits;
    const openBackbone = backbone.open;
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
        REVERB_LANGUAGES.includes(voice.language) &&
        (voice.speechFrames === undefined ||
          (Number.isInteger(voice.speechFrames) && voice.speechFrames > 0));
      if (!valid) {
        throw RnExecuTorchError(
          code,
          `${ctx}: A voice holds [${CODEBOOKS}, frames] codes below ${CODES}, with ` +
            `${referenceFrames.min} to ${referenceFrames.max} frames, a transcript, a ` +
            `supported language, and, if given, a positive integer of speech frames.`
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
        postprocess: Required<ReverbPostprocessOptions>;
        pause: number;
      }
    ): Float32Array => {
      'worklet';

      const { steps, remaskRatio, seed, postprocess, pause } = chunkOpts;
      const slots = 2 * frames;
      const tokens = new BigInt64Array(CODEBOOKS * frames).fill(MASK_CODE);
      const pass = {
        confidence: new Float32Array(slots),
        prediction: new BigInt64Array(slots),
        held: new Float32Array(slots),
      };
      const schedule = commitSchedule(steps);
      const random = mulberry32(seed);

      // The chunk's session and tensors, released together when it ends
      const local = createResourceScope();

      try {
        // 1. Prefill the prompt and the reference
        const session = local.track(openBackbone(ids, voice.codes, frames));

        // 2. Main passes over codebooks 0-1
        for (let step = 0; step < steps; step++) {
          session.step(tokens, pass);
          samplePass(tokens, frames, pass, step, schedule, remaskRatio, random);
        }

        // 3. Polish codebooks 2-7
        session.polish(tokens);

        // 4. Decode
        const tCodes = local.track(tensor('int64', [CODEBOOKS, frames], tokens));
        const tAudio = local.track(tensor('float32', [frames * FRAME_SAMPLES]));
        decoder.execute('forward', [tCodes], [tAudio]);
        let audio: Float32Array = tAudio.getData(new Float32Array(frames * FRAME_SAMPLES));

        // 5. Cut the end, then trim the silent edges
        if (postprocess.enabled) {
          const { endCut, silenceThreshold, keep } = postprocess;
          const end = Math.max(0, audio.length - Math.floor(endCut * REVERB_SAMPLE_RATE));
          audio = trimSilence(audio.subarray(0, end), REVERB_SAMPLE_RATE, silenceThreshold, keep);
        }

        // 6. Append the pause the chunk's final punctuation calls for
        const result = new Float32Array(audio.length + Math.round(pause * REVERB_SAMPLE_RATE));
        result.set(audio);
        return result;
      } finally {
        local.dispose();
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
      const clip = audio.slice(0, count * FRAME_SAMPLES);
      const codes = await encode(clip);
      // The clip stays whole; only its speaking time is measured, for the length estimate.
      const speechFrames = roundHalfEven(
        speechLength(clip, REVERB_SAMPLE_RATE) * REVERB_FRAME_RATE
      );

      return { codes, transcript: prepareText(transcript, language), language, speechFrames };
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
      const pace = options.pace ?? 'speech';
      if (pace !== 'speech' && pace !== 'recording') {
        throw RnExecuTorchError(
          'INVALID_ARGUMENT',
          "synthesize: pace must be 'speech' or 'recording'."
        );
      }
      // The reference length the estimate follows; the model still takes every reference frame.
      const paceFrames =
        pace === 'speech' ? Math.min(voice.speechFrames ?? references, references) : references;

      const speed = options.speed ?? DEFAULT_SPEED;
      if (!(speed >= MIN_SPEED && speed <= MAX_SPEED)) {
        throw RnExecuTorchError(
          'INVALID_ARGUMENT',
          `synthesize: speed must be between ${MIN_SPEED} and ${MAX_SPEED}.`
        );
      }

      // A chunk at the limit must still fit the backbone's target window.
      const maxDuration = maxFrames / REVERB_FRAME_RATE;
      const maxChunkDuration =
        options.maxChunkDuration ?? Math.min(DEFAULT_MAX_CHUNK_DURATION, maxDuration);
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
      const postprocess = {
        enabled: options.postprocess?.enabled ?? DEFAULT_POSTPROCESS.enabled,
        endCut: options.postprocess?.endCut ?? DEFAULT_POSTPROCESS.endCut,
        silenceThreshold:
          options.postprocess?.silenceThreshold ?? DEFAULT_POSTPROCESS.silenceThreshold,
        keep: options.postprocess?.keep ?? DEFAULT_POSTPROCESS.keep,
      };
      if (postprocess.enabled) {
        const { endCut, silenceThreshold, keep } = postprocess;
        if (!(Number.isFinite(endCut) && endCut >= 0)) {
          throw RnExecuTorchError(
            'INVALID_ARGUMENT',
            'synthesize: postprocess.endCut must be a finite number of seconds, 0 or more.'
          );
        }
        if (!Number.isFinite(silenceThreshold)) {
          throw RnExecuTorchError(
            'INVALID_ARGUMENT',
            'synthesize: postprocess.silenceThreshold must be a finite level in dBFS.'
          );
        }
        if (!(Number.isFinite(keep) && keep >= 0)) {
          throw RnExecuTorchError(
            'INVALID_ARGUMENT',
            'synthesize: postprocess.keep must be a finite number of seconds, 0 or more.'
          );
        }
      }

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
        estimateTargetFrames(chunk, voice.transcript, paceFrames) / speed;

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
