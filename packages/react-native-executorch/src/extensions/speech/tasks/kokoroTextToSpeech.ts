import type { WorkletRuntime } from 'react-native-worklets';

import RNBlobUtil from 'react-native-blob-util';

import { tensor, type Tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import {
  validateSpec,
  method,
  i64,
  f32,
  bool,
  DynamicDim as Dyn,
  constr,
} from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';
import { RnExecuTorchError } from '../../../core/error';
import { createPhonemizer, type PhonemizerConfig } from '../utils/phonemizer';
import { partition } from '../utils/textPartitioner';
import {
  isLetter,
  parseVoice,
  pauseAfter,
  repeatInterleave,
  scaleDurations,
  stripAudio,
  tokenize,
  KOKORO_TICKS_PER_DURATION as TICKS_PER_DURATION,
  KOKORO_VOICE_REF_SIZE as VOICE_REF_SIZE,
} from '../utils/kokoroUtils';

/**
 * Kokoro audio sampling rate in Hz (24000).
 * @category Constants
 */
export const KOKORO_SAMPLE_RATE = 24000;

const SAMPLES_PER_MS = KOKORO_SAMPLE_RATE / 1000;
const VOICE_REF_HALF_SIZE = VOICE_REF_SIZE / 2;
const DURATION_FEATURE_DIM = 640; // per-token duration features consumed by the synthesizer
const MIN_DURATION_TICKS = 16;

const DEFAULT_SPEED = 1.0;
const MIN_SPEED = 0.1;
const MAX_SPEED = 3.0;
const SILENCE_PADDING_MS = 50; // silence kept at both edges of a synthesized chunk

/**
 * Model configuration required to instantiate the Kokoro Text-to-Speech pipeline.
 * @category Types
 * @typeParam K Voice keys record constraint (strictly inferred from voices keys).
 */
export type KokoroTtsModel<K extends PropertyKey> = {
  /** Local or remote file paths to the 2 Kokoro `.pte` sub-models. */
  readonly modelPaths: {
    /** Path to the duration predictor `.pte` model. */
    readonly durationPredictor: string;
    /** Path to the synthesizer `.pte` model. */
    readonly synthesizer: string;
  };
  /** Grapheme-to-phoneme configuration matching the model's language. */
  readonly phonemizer: PhonemizerConfig;
  /** Map of voice names to local or remote voice `.bin` file paths. */
  readonly voices: Record<K, string>;
};

/**
 * Per-call execution options for Kokoro Text-to-Speech synthesis.
 * @category Types
 * @typeParam K Voice keys record constraint.
 */
export type KokoroTtsOptions<K extends PropertyKey> = {
  /** Voice name matching one of the keys in `config.voices`. */
  readonly voice: K;
  /** Speech speed factor (range: 0.1 to 3.0). */
  readonly speed?: number;
  /** If false, the input is treated as IPA phonemes and not phonemized. */
  readonly phonemize?: boolean;
  /** Maximum phoneme count per chunk. Defaults to the model's token limit. */
  readonly maxChunkLength?: number;
};

/**
 * Audio output chunk yielded by the {@link createKokoroTextToSpeech} generator.
 * @category Types
 */
export type KokoroTtsChunk = {
  /** Float32 PCM audio samples for this chunk, normalized in `[-1, 1]`. */
  readonly audio: Float32Array;
  /** Audio sampling rate in Hz (see {@link KOKORO_SAMPLE_RATE}). */
  readonly sampleRate: number;
  /** Duration of this audio chunk in seconds. */
  readonly duration: number;
  /** Zero-based index of this chunk. */
  readonly chunkIndex: number;
  /** Total number of chunks partitioned from the input text. */
  readonly totalChunks: number;
};

/**
 * Creates a Kokoro Text-to-Speech pipeline.
 *
 * It validates both sub-model method schemas, builds the grapheme-to-phoneme
 * pipeline, pre-parses the voice files into memory, and registers disposal
 * hooks to release all native resources.
 * @category Typescript API
 * @typeParam K Voice keys record constraint.
 * @param config Kokoro TTS pipeline configuration containing model and asset paths.
 * @param runtime Optional worklet runtime thread on which to run inference.
 * @returns A promise resolving to an object with audio synthesis and disposal controls.
 */
export async function createKokoroTextToSpeech<K extends PropertyKey>(
  config: KokoroTtsModel<K>,
  runtime?: WorkletRuntime
): Promise<{
  /** Releases the allocated native models, phonemizer and execution tensors. */
  dispose: () => void;

  /**
   * Streams synthesized audio chunks as an async generator as each text chunk finishes.
   * @param text Input text (or IPA phonemes) to synthesize into speech.
   * @param options Per-call execution options.
   * @param options.voice Voice name, one of the keys of the config's `voices`.
   * @param options.speed Speech speed factor (range: 0.1 to 3.0). Defaults to 1.0.
   * @param options.phonemize Whether to phonemize the input. Defaults to true.
   * @param options.maxChunkLength Maximum phoneme count per chunk.
   * @returns An AsyncGenerator yielding {@link KokoroTtsChunk} audio buffers.
   */
  synthesize: (text: string, options: KokoroTtsOptions<K>) => AsyncGenerator<KokoroTtsChunk>;

  /** Cancels any in-flight synthesis started by {@link synthesize}. */
  synthesizeStop: () => void;
}> {
  const load = wrapAsync(loadModel, runtime);
  const [durationPredictor, synthesizer] = await Promise.all([
    load(config.modelPaths.durationPredictor),
    load(config.modelPaths.synthesizer),
  ]);
  const models = { durationPredictor, synthesizer };

  const predictorSpec = validateSpec(models.durationPredictor.schema, {
    default: method(
      'forward',
      [
        i64(1, Dyn('T')), // tokens
        bool(1, Dyn('T')), // textMask
        f32(1, VOICE_REF_HALF_SIZE), // voiceRef
        f32(1), // speed
      ],
      [
        i64(Dyn('T')), // predictedDurations
        f32(1, Dyn('T'), DURATION_FEATURE_DIM), // durationFeatures
      ],
      [
        constr.eq(
          { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
          { paramSide: 'input', tensorIdx: 1, dimIdx: 1 },
          { paramSide: 'output', tensorIdx: 0, dimIdx: 0 },
          { paramSide: 'output', tensorIdx: 1, dimIdx: 1 }
        ),
      ]
    ),
  });

  const synthesizerSpec = validateSpec(models.synthesizer.schema, {
    default: method(
      'forward',
      [
        i64(1, Dyn('T')), // tokens
        bool(1, Dyn('T')), // textMask
        i64(Dyn('D')), // indices
        f32(1, Dyn('T'), DURATION_FEATURE_DIM), // durationFeatures
        f32(1, VOICE_REF_SIZE), // voiceRef
      ],
      [f32(1, 1, Dyn('AUDIO_LEN'))], // audio
      [
        constr.eq(
          { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
          { paramSide: 'input', tensorIdx: 1, dimIdx: 1 },
          { paramSide: 'input', tensorIdx: 3, dimIdx: 1 }
        ),
        constr.linear(
          { paramSide: 'output', tensorIdx: 0, dimIdx: 2 },
          { paramSide: 'input', tensorIdx: 2, dimIdx: 0 },
          TICKS_PER_DURATION
        ),
      ]
    ),
  });

  const [predictorTokens] = predictorSpec.dims.range('T');
  const [synthesizerTokens, durations] = synthesizerSpec.dims.range('T', 'D');

  if (predictorTokens.max !== synthesizerTokens.max) {
    throw RnExecuTorchError(
      'SCHEMA_MISMATCH',
      'createKokoroTextToSpeech: incompatible duration predictor and synthesizer token limits.'
    );
  }

  const minTokens = Math.max(predictorTokens.min, synthesizerTokens.min);
  const maxTokens = predictorTokens.max;
  const maxDurationTicks = durations.max;

  const phonemizer = await wrapAsync(createPhonemizer, runtime)(config.phonemizer);

  // Pre-parse the voice matrices into memory
  const parsedVoices = {} as Record<K, Float32Array>;
  for (const [key, path] of Object.entries(config.voices) as [K, string][]) {
    parsedVoices[key] = parseVoice(await RNBlobUtil.fs.readFile(path, 'base64'));
  }

  const tensors = [
    tensor('float32', [1, VOICE_REF_HALF_SIZE]),
    tensor('float32', [1, VOICE_REF_SIZE]),
    tensor('float32', [1]),
  ] as const;

  const [tVoiceRefHalf, tVoiceRef, tSpeed] = tensors;

  const dispose = () => {
    tensors.forEach((t) => t.dispose());
    Object.values(models).forEach((m) => m.dispose());
    phonemizer.dispose();
  };

  const synthesizeChunkWorklet = (
    chunkPhonemes: string,
    chunkOpts: { voice: K; speed: number }
  ): { audio: Float32Array; sampleRate: number; duration: number } => {
    'worklet';

    const phonemes = Array.from(chunkPhonemes.trim());
    const voice = parsedVoices[chunkOpts.voice]!;

    // 2 tokens are reserved for the leading and trailing padding
    const numTokens = Math.min(Math.max(phonemes.length + 2, minTokens), maxTokens);
    const tokens = tokenize(phonemes, numTokens);

    // Exclude all paddings except the leading and the trailing one
    const textMask = new Uint8Array(numTokens);
    textMask.fill(1, 0, Math.min(phonemes.length + 2, numTokens));

    // Each input token count corresponds to a different voice reference vector
    const voiceRows = voice.length / VOICE_REF_SIZE;
    const voiceRow = Math.min(phonemes.length - 1, numTokens - 1, voiceRows - 1);
    const voiceOffset = Math.max(0, voiceRow) * VOICE_REF_SIZE;

    tVoiceRef.setData(voice.subarray(voiceOffset, voiceOffset + VOICE_REF_SIZE));
    tVoiceRefHalf.setData(
      voice.subarray(voiceOffset + VOICE_REF_HALF_SIZE, voiceOffset + VOICE_REF_SIZE)
    );
    tSpeed.setData(new Float32Array([chunkOpts.speed]));

    // Collect dynamic execution tensors for cleanup in a single try/finally block
    const auxTensors: Tensor[] = [];

    try {
      // 1. Predict per-token durations
      const tTokens = tensor('int64', [1, numTokens], tokens);
      const tTextMask = tensor('bool', [1, numTokens], textMask);
      const tPredictedDurations = tensor('int64', [numTokens]);
      const tDurationFeatures = tensor('float32', [1, numTokens, DURATION_FEATURE_DIM]);
      auxTensors.push(tTokens, tTextMask, tPredictedDurations, tDurationFeatures);

      models.durationPredictor.execute(
        'forward',
        [tTokens, tTextMask, tVoiceRefHalf, tSpeed],
        [tPredictedDurations, tDurationFeatures]
      );

      const predicted = tPredictedDurations.getData(new BigInt64Array(numTokens));
      const tokenDurations = new Int32Array(numTokens);
      let totalDuration = 0;
      for (let i = 0; i < numTokens; i++) {
        tokenDurations[i] = Number(predicted[i]!);
        totalDuration += tokenDurations[i]!;
      }

      // 2. Fit the predicted durations into the model's supported range
      const clampedDuration = Math.min(
        Math.max(totalDuration, MIN_DURATION_TICKS),
        maxDurationTicks
      );
      if (clampedDuration !== totalDuration) {
        scaleDurations(tokenDurations, clampedDuration);
      }

      const indices = repeatInterleave(tokenDurations);
      if (indices.length === 0) {
        return { audio: new Float32Array(0), sampleRate: KOKORO_SAMPLE_RATE, duration: 0 };
      }

      // 3. Synthesize the waveform
      const tIndices = tensor('int64', [indices.length], indices);
      const tAudio = tensor('float32', [1, 1, indices.length * TICKS_PER_DURATION]);
      auxTensors.push(tIndices, tAudio);

      models.synthesizer.execute(
        'forward',
        [tTokens, tTextMask, tIndices, tDurationFeatures, tVoiceRef],
        [tAudio]
      );

      // 4. Post-processing: trim the audio down to the spoken phonemes.
      // The padded tail of the input contributes trailing artifacts, so the
      // waveform is cut at the effective duration, then at the last spoken
      // token's timestamp, and finally stripped of the remaining silence.
      let padIndex = numTokens;
      for (let i = 1; i < numTokens; i++) {
        if (tokens[i] === 0n) {
          padIndex = i;
          break;
        }
      }

      let effectiveDuration = 0;
      for (let i = 0; i <= padIndex && i < numTokens; i++) {
        effectiveDuration += tokenDurations[i]!;
      }

      let audio: Float32Array = tAudio.getData(new Float32Array(tAudio.numel));
      audio = audio.subarray(0, Math.min(effectiveDuration * TICKS_PER_DURATION, audio.length));

      if (numTokens > 2) {
        // Skip the trailing PAD token, as well as any punctuation just before it
        const lastPhoneme = phonemes[phonemes.length - 1] ?? '';
        const lastTokenIndex = isLetter(lastPhoneme) ? numTokens - 2 : numTokens - 3;

        let lastTimestamp = 0;
        for (let i = 0; i <= lastTokenIndex; i++) lastTimestamp += tokenDurations[i]!;
        audio = audio.subarray(0, Math.min(lastTimestamp * TICKS_PER_DURATION, audio.length));
      }

      audio = stripAudio(audio, SILENCE_PADDING_MS * SAMPLES_PER_MS);

      // 5. Append a natural pause matching the chunk's ending punctuation
      const pauseSamples = pauseAfter(phonemes[phonemes.length - 1] ?? '') * SAMPLES_PER_MS;
      const result = new Float32Array(audio.length + pauseSamples);
      result.set(audio);

      return {
        audio: result,
        sampleRate: KOKORO_SAMPLE_RATE,
        duration: result.length / KOKORO_SAMPLE_RATE,
      };
    } finally {
      auxTensors.forEach((t) => t.dispose());
    }
  };

  const synthesizeChunk = wrapAsync(synthesizeChunkWorklet, runtime);
  const phonemize = wrapAsync((text: string) => {
    'worklet';
    return phonemizer.phonemize(text);
  }, runtime);

  let isSynthesizing = false;
  const synthesizeStop = (): void => {
    isSynthesizing = false;
  };

  async function* synthesize(
    text: string,
    options: KokoroTtsOptions<K>
  ): AsyncGenerator<KokoroTtsChunk> {
    if (isSynthesizing) {
      throw RnExecuTorchError('INVALID_STATE', 'synthesize: Synthesis is already in progress.');
    }

    if (!text || !text.trim()) {
      throw RnExecuTorchError('INVALID_ARGUMENT', 'synthesize: Input text cannot be empty.');
    }

    if (!(options.voice in parsedVoices)) {
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        `synthesize: Unknown voice: ${String(options.voice)}.`
      );
    }

    const speed = options.speed ?? DEFAULT_SPEED;
    if (speed < MIN_SPEED || speed > MAX_SPEED) {
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        `synthesize: speed must be between ${MIN_SPEED} and ${MAX_SPEED}.`
      );
    }

    const maxChunkLength = Math.min(options.maxChunkLength ?? maxTokens - 2, maxTokens - 2);

    // Phonemize once up front, then partition the phonemes — every chunk is
    // then guaranteed to fit the models' token limit.
    const phonemes = options.phonemize === false ? text : await phonemize(text);
    const chunks = partition(phonemes, maxChunkLength, { prioritizeInitialTtfa: true });

    isSynthesizing = true;
    try {
      for (const [chunkIndex, chunk] of chunks.entries()) {
        if (!isSynthesizing) break;

        const audioChunk = await synthesizeChunk(chunk, { voice: options.voice, speed });
        yield { ...audioChunk, chunkIndex, totalChunks: chunks.length };
      }
    } finally {
      isSynthesizing = false;
    }
  }

  return { dispose, synthesize, synthesizeStop };
}
