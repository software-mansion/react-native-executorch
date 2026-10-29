/**
 * Qwen3-ASR Speech-to-Text (STT) transcription and live-streaming task pipeline.
 */

import type { WorkletRuntime } from 'react-native-worklets';
import { scheduleOnRN, createSynchronizable } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { wrapAsync } from '../../../core/runtime';
import {
  f32,
  i64,
  method,
  validateSpec,
  DynamicDim as Dyn,
  StaticDim as Static,
  type SymbolicDim,
} from '../../../core/schema';

import { argmax } from '../../../extensions/math';
import { loadTokenizer } from '../../nlp/tokenizer';
import {
  createFsmnVoiceActivityDetector,
  type FsmnVadModel,
  type VadStreamOptions,
} from './fsmnVoiceActivityDetection';
import { RnExecuTorchError } from '../../../core/error';
import { createResourceScope } from '../../../core/lifetime';

/**
 * Sample rate (Hz) Qwen3-ASR models expect their input waveform to be at.
 * @category Speech / Constants
 */
export const QWEN3_ASR_SAMPLE_RATE_HZ = 16000;

const MEL_BINS = 128;
const HOP_LENGTH = 160; // waveform samples per mel frame
const CHUNK_FRAMES = 100; // the encoder convolves 1 s chunks independently
const TOKENS_PER_CHUNK = 13; // audio tokens per full chunk
const WINDOW_FRAMES = 800; // the encoder attends within 8 s windows
const MIN_SAMPLES = QWEN3_ASR_SAMPLE_RATE_HZ / 2; // shorter audio is zero padded, like the reference
const SPLIT_SEARCH_SAMPLES = 5 * QWEN3_ASR_SAMPLE_RATE_HZ; // how far back to look for a quiet cut
const ENERGY_WINDOW_SAMPLES = QWEN3_ASR_SAMPLE_RATE_HZ / 10; // 100 ms energy window for the cut
const STRIDE_SIZE = 1 * QWEN3_ASR_SAMPLE_RATE_HZ; // streaming: new samples before re-transcribing

/**
 * Language codes supported by Qwen3-ASR, mapped to the language names the
 * model was trained to emit and accept.
 * @category Speech / Constants
 */
export const QWEN3_ASR_LANGUAGES = {
  zh: 'Chinese',
  en: 'English',
  yue: 'Cantonese',
  ar: 'Arabic',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  pt: 'Portuguese',
  id: 'Indonesian',
  it: 'Italian',
  ko: 'Korean',
  ru: 'Russian',
  th: 'Thai',
  vi: 'Vietnamese',
  ja: 'Japanese',
  tr: 'Turkish',
  hi: 'Hindi',
  ms: 'Malay',
  nl: 'Dutch',
  sv: 'Swedish',
  da: 'Danish',
  fi: 'Finnish',
  pl: 'Polish',
  cs: 'Czech',
  fil: 'Filipino',
  fa: 'Persian',
  el: 'Greek',
  ro: 'Romanian',
  hu: 'Hungarian',
  mk: 'Macedonian',
} as const;

/**
 * Union type of all language codes supported by Qwen3-ASR. Derived from
 * {@link QWEN3_ASR_LANGUAGES}.
 * @category Speech / Types
 */
export type Qwen3AsrLanguage = keyof typeof QWEN3_ASR_LANGUAGES;

/**
 * Options passed to a single transcription call.
 * @category Speech / Types
 */
export type Qwen3AsrSttOptions = {
  /**
   * Language of the spoken audio. Omit to let the model detect it; set it to
   * skip detection and force a transcript in that language.
   */
  readonly language?: Qwen3AsrLanguage;
};

/**
 * Options for the live-streaming transcription API.
 * Extends {@link Qwen3AsrSttOptions} with optional VAD tuning.
 * @category Speech / Types
 */
export type Qwen3AsrStreamOptions = Qwen3AsrSttOptions & {
  /**
   * Fine-tuning knobs forwarded to the voice-activity detector. Omit to use
   * built-in defaults.
   */
  readonly vadOptions?: VadStreamOptions;
};

/**
 * Paths required to instantiate a Qwen3-ASR speech-to-text model.
 * @category Speech / Types
 */
export type Qwen3AsrSttModel = {
  /** Pipeline tag, which tells {@link useSpeechToText} which runner to build. */
  readonly name: 'qwen3-asr';
  /** Local path or remote URL of the `.pte` model. */
  readonly modelPath: string;
  /** Local path or remote URL of the `tokenizer.json` file. */
  readonly tokenizerPath: string;
  /** VAD model configuration used for speech segmentation while streaming. */
  readonly vadModel: FsmnVadModel;
};

/**
 * Qwen3-ASR speech-to-text task runner.
 * @category Speech / Types
 */
export type Qwen3AsrSpeechToText = {
  /**
   * Releases all allocated native resources.
   */
  readonly dispose: () => void;

  /**
   * Asynchronously transcribes a pre-recorded mono waveform sampled at
   * {@link QWEN3_ASR_SAMPLE_RATE_HZ}. Audio of any length is accepted; long
   * recordings are split at quiet points into pieces the model can take in
   * one pass.
   * @param audio Raw 16 kHz mono PCM audio samples (Float32Array).
   * @param options Transcription options. See {@link Qwen3AsrSttOptions}.
   * @param onToken Optional callback fired on the RN thread for each decoded
   * transcript token.
   * @returns A promise resolving to the full transcript string.
   * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if the language is
   * unsupported, `RESOURCE_BUSY` if the model is in use, or `RESOURCE_DISPOSED`
   * if disposed.
   */
  readonly transcribe: (
    audio: Float32Array,
    options?: Qwen3AsrSttOptions,
    onToken?: (token: string) => void
  ) => Promise<string>;

  /**
   * Synchronous version of {@link transcribe} to be executed directly on the
   * caller or worklet thread.
   */
  readonly transcribeWorklet: (
    audio: Float32Array,
    options?: Qwen3AsrSttOptions,
    onToken?: (token: string) => void
  ) => string;

  /**
   * Interrupts and stops any active transcription call.
   */
  readonly transcribeStop: () => void;

  /**
   * Async generator for real-time microphone transcription. Feed audio with
   * {@link streamInsert} and stop with {@link streamStop}. Yields `{ committed,
   * nonCommitted }` on every VAD or transcription event: `committed` is the
   * finalized transcript so far; `nonCommitted` is the in-progress text that
   * may still change.
   * @param options Stream options (language and optional VAD tuning).
   * See {@link Qwen3AsrStreamOptions}.
   * @returns An AsyncGenerator yielding transcript updates.
   * @throws {RnExecuTorchError} With code `INVALID_STATE` if streaming is
   * already in progress, or `INVALID_ARGUMENT` if the language is unsupported.
   */
  readonly stream: (
    options?: Qwen3AsrStreamOptions
  ) => AsyncGenerator<{ committed: string; nonCommitted: string }>;

  /**
   * Signals the {@link stream} generator to finalize the current segment and
   * return. Safe to call even when streaming is not active.
   */
  readonly streamStop: () => void;

  /**
   * Appends a new PCM chunk to the live streaming buffer consumed by
   * {@link stream}. Ignored when streaming is not active.
   * @param audioChunk The newly captured audio samples (16 kHz mono Float32
   * PCM).
   */
  readonly streamInsert: (audioChunk: Float32Array) => void;
};

/**
 * Number of audio tokens the encoder emits for `frames` mel frames.
 * @param frames Mel frames.
 * @returns Audio token count.
 */
function audioTokenCount(frames: number): number {
  'worklet';
  const rem = frames % CHUNK_FRAMES;
  let tail = 0;
  if (rem > 0) {
    const a = Math.floor((rem - 1) / 2) + 1;
    const b = Math.floor((a - 1) / 2) + 1;
    tail = Math.floor((b - 1) / 2) + 1;
  }
  return Math.floor(frames / CHUNK_FRAMES) * TOKENS_PER_CHUNK + tail;
}

/**
 * Splits `audio` into pieces of at most `maxSamples`, cutting each at the
 * quietest 100 ms within the last 5 s before the limit, so a word is rarely
 * cut in half.
 * @param audio Input waveform.
 * @param maxSamples Longest piece the model accepts.
 * @returns `[start, end)` sample ranges covering `audio` without gaps.
 */
function splitAtQuietPoints(audio: Float32Array, maxSamples: number): [number, number][] {
  'worklet';
  const pieces: [number, number][] = [];
  let start = 0;
  while (audio.length - start > maxSamples) {
    const limit = start + maxSamples;
    const from = Math.max(start + ENERGY_WINDOW_SAMPLES, limit - SPLIT_SEARCH_SAMPLES);
    let energy = 0;
    for (let i = from - ENERGY_WINDOW_SAMPLES; i < from; i++) energy += audio[i]! * audio[i]!;
    let best = from;
    let bestEnergy = energy;
    for (let end = from + 1; end <= limit; end++) {
      const enter = audio[end - 1]!;
      const leave = audio[end - 1 - ENERGY_WINDOW_SAMPLES]!;
      energy += enter * enter - leave * leave;
      if (energy < bestEnergy) {
        bestEnergy = energy;
        best = end;
      }
    }
    // Cut in the middle of the quietest window.
    const cut = best - ENERGY_WINDOW_SAMPLES / 2;
    pieces.push([start, cut]);
    start = cut;
  }
  pieces.push([start, audio.length]);
  return pieces;
}

/**
 * Maps the language code in `options` to the name the model emits.
 * @param options Transcription options.
 * @returns The language name, or `undefined` to let the model detect it.
 */
function resolveLanguage(options?: Qwen3AsrSttOptions): string | undefined {
  'worklet';
  if (options?.language === undefined) return undefined;
  const name = (QWEN3_ASR_LANGUAGES as Record<string, string>)[options.language];
  if (name === undefined) {
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
      `Language "${options.language}" is not supported by Qwen3-ASR.`
    );
  }
  return name;
}

// prettier-ignore
const qwen3AsrSpec = (melFrames: SymbolicDim, audioTokens: SymbolicDim) => ({
  ...method(
    'preprocess',
    [f32(Dyn('Samples'))],
    [f32(1, MEL_BINS, Dyn('Frames'))]
  ),
  ...method(
    'audio_encoder', // One 8 s attention window: whole 100-frame chunks, plus the valid token count.
    [f32(1, MEL_BINS, melFrames), i64(1)],
    [f32(1, audioTokens, 'Dim')]
  ),
  ...method(
    'token_embedding',
    [i64(1, Dyn('Tokens'))],
    [f32(1, Dyn('Tokens'), 'Dim')]
  ),
  ...method(
    'text_decoder',
    [f32(1, Dyn('PrefillLen'), 'Dim'), i64(1)],
    [f32(1, 'VocabSize')]
  ),
});

/**
 * Loads a Qwen3-ASR model and returns a set of transcription helpers.
 * @category Speech / Tasks
 * @param config Model paths and VAD configuration. See {@link Qwen3AsrSttModel}.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to the instantiated {@link Qwen3AsrSpeechToText}
 * runner.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if the model, tokenizer,
 * or VAD fails to load, or `SCHEMA_MISMATCH` if model schemas do not match the
 * Qwen3-ASR specification.
 */
export async function createQwen3AsrSpeechToText(
  config: Qwen3AsrSttModel,
  runtime?: WorkletRuntime
): Promise<Qwen3AsrSpeechToText> {
  const scope = createResourceScope();
  const dispose = scope.dispose;

  try {
    const { modelPath, tokenizerPath, vadModel } = config;
    const model = scope.track(await wrapAsync(loadModel, runtime)(modelPath));
    const tokenizer = scope.track(await wrapAsync(loadTokenizer, runtime)(tokenizerPath));
    const voiceDetector = scope.track(await createFsmnVoiceActivityDetector(vadModel, runtime));

    const match = validateSpec(model.schema, {
      dynamic: qwen3AsrSpec(Dyn('MelFrames'), Dyn('AudioTokens')),
      static: qwen3AsrSpec(Static('MelFrames'), Static('AudioTokens')),
    });
    const isEncoderDynamic = match.variant === 'dynamic';
    const [dim, vocabSize] = match.dims.constant('Dim', 'VocabSize');
    const [samples, tokens, prefill] = match.dims.range('Samples', 'Tokens', 'PrefillLen');
    // The KV cache holds as many positions as token_embedding accepts.
    const maxContext = tokens.max;
    const maxPrefill = prefill.max;
    // Longest piece transcribed in one pass: the preprocess bound, capped so
    // its audio tokens leave at least half of the context for the transcript.
    const maxSamples = Math.min(
      samples.max,
      Math.floor((maxContext / 2 / TOKENS_PER_CHUNK) * CHUNK_FRAMES) * HOP_LENGTH
    );

    const id = (token: string) => tokenizer.tokenToId(token);
    const text = (s: string) => {
      'worklet';
      return Array.from(tokenizer.encode(s));
    };
    const asrTextToken = id('<asr_text>');
    const eosTokens = [id('<|im_end|>'), id('<|endoftext|>')];
    const promptPrefix = [
      id('<|im_start|>'),
      ...text('system\n'),
      id('<|im_end|>'),
      ...text('\n'),
      id('<|im_start|>'),
      ...text('user\n'),
      id('<|audio_start|>'),
    ];
    const promptSuffix = [
      id('<|audio_end|>'),
      id('<|im_end|>'),
      ...text('\n'),
      id('<|im_start|>'),
      ...text('assistant\n'),
    ];

    const tensors = [
      tensor('int64', [1]), // tPosition
      tensor('int64', [1]), // tValidTokens
      tensor('int64', [1, 1]), // tToken
      tensor('float32', [1, 1, dim]), // tTokenEmbedding
      tensor('float32', [1, vocabSize]), // tLogits
      tensor('int32', [1, 1]), // tArgmax
    ] as const;
    tensors.forEach(scope.track);
    const [tPosition, tValidTokens, tToken, tTokenEmbedding, tLogits, tArgmax] = tensors;

    const isCancelled = createSynchronizable(false);

    const embedTokens = (ids: number[]): Float32Array => {
      'worklet';
      const tIds = tensor('int64', [1, ids.length], BigInt64Array.from(ids.map(BigInt)));
      const tOut = tensor('float32', [1, ids.length, dim]);
      try {
        model.execute('token_embedding', [tIds], [tOut]);
        return tOut.getData(new Float32Array(ids.length * dim));
      } finally {
        tIds.dispose();
        tOut.dispose();
      }
    };

    const encodeAudio = (audio: Float32Array): Float32Array => {
      'worklet';
      const frames = Math.floor(audio.length / HOP_LENGTH);
      const tWave = tensor('float32', [audio.length], audio);
      const tMel = tensor('float32', [1, MEL_BINS, frames]);
      let mel: Float32Array;
      try {
        model.execute('preprocess', [tWave], [tMel]);
        mel = tMel.getData(new Float32Array(MEL_BINS * frames));
      } finally {
        tWave.dispose();
        tMel.dispose();
      }

      const embeddings = new Float32Array(audioTokenCount(frames) * dim);
      let written = 0;
      for (let w0 = 0; w0 < frames; w0 += WINDOW_FRAMES) {
        const f = Math.min(WINDOW_FRAMES, frames - w0);
        // The partial last chunk is zero padded, as the reference pads it.
        const width = isEncoderDynamic ? Math.ceil(f / CHUNK_FRAMES) * CHUNK_FRAMES : WINDOW_FRAMES;
        const window = new Float32Array(MEL_BINS * width);
        for (let bin = 0; bin < MEL_BINS; bin++) {
          window.set(mel.subarray(bin * frames + w0, bin * frames + w0 + f), bin * width);
        }
        const valid = audioTokenCount(f);
        const outTokens = (width / CHUNK_FRAMES) * TOKENS_PER_CHUNK;
        const tWindow = tensor('float32', [1, MEL_BINS, width], window);
        const tOut = tensor('float32', [1, outTokens, dim]);
        try {
          tValidTokens.setData(new BigInt64Array([BigInt(valid)]));
          model.execute('audio_encoder', [tWindow, tValidTokens], [tOut]);
          const out = tOut.getData(new Float32Array(outTokens * dim));
          embeddings.set(out.subarray(0, valid * dim), written);
        } finally {
          tWindow.dispose();
          tOut.dispose();
        }
        written += valid * dim;
      }
      return embeddings;
    };

    // Feeds `embeddings` into the KV cache from `start`; returns the next token.
    const prefillEmbeddings = (embeddings: Float32Array, start: number): number => {
      'worklet';
      const length = embeddings.length / dim;
      for (let offset = 0; offset < length; offset += maxPrefill) {
        const n = Math.min(maxPrefill, length - offset);
        const tChunk = tensor(
          'float32',
          [1, n, dim],
          embeddings.subarray(offset * dim, (offset + n) * dim).slice()
        );
        try {
          tPosition.setData(new BigInt64Array([BigInt(start + offset)]));
          model.execute('text_decoder', [tChunk, tPosition], [tLogits]);
        } finally {
          tChunk.dispose();
        }
      }
      return tLogits.through(argmax, tArgmax).getData(new Int32Array(1))[0]!;
    };

    const decodeStep = (token: number, position: number): number => {
      'worklet';
      tToken.setData(new BigInt64Array([BigInt(token)]));
      model.execute('token_embedding', [tToken], [tTokenEmbedding]);
      tPosition.setData(new BigInt64Array([BigInt(position)]));
      model.execute('text_decoder', [tTokenEmbedding, tPosition], [tLogits]);
      return tLogits.through(argmax, tArgmax).getData(new Int32Array(1))[0]!;
    };

    const transcribePiece = (
      audio: Float32Array,
      forcedLanguage: string | undefined,
      onToken?: (token: string) => void
    ): string => {
      'worklet';
      if (audio.length < MIN_SAMPLES) {
        const padded = new Float32Array(MIN_SAMPLES);
        padded.set(audio);
        audio = padded;
      }
      const audioEmbeddings = encodeAudio(audio);
      const suffix = forcedLanguage
        ? [...promptSuffix, ...text(`language ${forcedLanguage}`), asrTextToken]
        : promptSuffix;
      const prefix = embedTokens(promptPrefix);
      const tail = embedTokens(suffix);
      const prompt = new Float32Array(prefix.length + audioEmbeddings.length + tail.length);
      prompt.set(prefix);
      prompt.set(audioEmbeddings, prefix.length);
      prompt.set(tail, prefix.length + audioEmbeddings.length);

      let position = prompt.length / dim;
      let nextToken = prefillEmbeddings(prompt, 0);

      // Without a forced language the model first writes `language <Name>`,
      // then `<asr_text>`, then the transcript; only the transcript is kept.
      let inTranscript = forcedLanguage !== undefined;
      const generated: number[] = [];
      while (position < maxContext && !eosTokens.includes(nextToken)) {
        if (isCancelled.getBlocking()) break;
        if (inTranscript) {
          generated.push(nextToken);
          if (onToken) scheduleOnRN(onToken, tokenizer.decode(Int32Array.of(nextToken)));
        } else if (nextToken === asrTextToken) {
          inTranscript = true;
          generated.length = 0; // drop the `language <Name>` header
        } else {
          generated.push(nextToken);
        }
        nextToken = decodeStep(nextToken, position);
        position++;
      }
      // No `<asr_text>` tag at all: the whole output is the transcript, which
      // is how the reference parses it.
      if (!inTranscript && onToken && generated.length > 0) {
        scheduleOnRN(onToken, tokenizer.decode(Int32Array.from(generated)));
      }
      const transcript = tokenizer.decode(Int32Array.from(generated)).trim();
      // `language None<asr_text>` marks audio with no speech in it.
      return !inTranscript && transcript.startsWith('language ') ? '' : transcript;
    };

    const transcribeWorklet = (
      audio: Float32Array,
      options?: Qwen3AsrSttOptions,
      onToken?: (token: string) => void
    ): string => {
      'worklet';
      isCancelled.setBlocking(false);
      const language = resolveLanguage(options);

      const parts: string[] = [];
      for (const [start, end] of splitAtQuietPoints(audio, maxSamples)) {
        if (isCancelled.getBlocking()) break;
        const part = transcribePiece(audio.subarray(start, end), language, onToken);
        if (part !== '') parts.push(part);
      }
      return parts.join(' ').trim();
    };

    const transcribe = wrapAsync(transcribeWorklet, runtime);
    const transcribeStop = () => isCancelled.setBlocking(true);

    let isStreaming = false;
    let audioBuffer = new Float32Array(0);
    let signal: (() => void) | null = null;

    const streamInsert = (audioChunk: Float32Array): void => {
      if (!isStreaming) return;

      const next = new Float32Array(audioBuffer.length + audioChunk.length);
      next.set(audioBuffer);
      next.set(audioChunk, audioBuffer.length);
      audioBuffer = next;
      signal?.();
      signal = null;
    };

    const streamStop = (): void => {
      if (!isStreaming) return;

      isStreaming = false;
      signal?.();
      signal = null;
    };

    async function* stream(
      options?: Qwen3AsrStreamOptions
    ): AsyncGenerator<{ committed: string; nonCommitted: string }> {
      if (isStreaming) {
        throw RnExecuTorchError('INVALID_STATE', 'Streaming is already in progress');
      }
      resolveLanguage(options);
      isStreaming = true;
      audioBuffer = new Float32Array(0);

      voiceDetector.resetStream();

      let isSpeaking = false;
      let currentText = '';
      let committedText = '';
      let processedLength = 0;

      const commit = () => {
        if (currentText !== '') {
          committedText += (committedText ? ' ' : '') + currentText;
          currentText = '';
        }
        audioBuffer = audioBuffer.slice(processedLength);
        processedLength = 0;
      };

      try {
        while (isStreaming) {
          if (audioBuffer.length - processedLength < STRIDE_SIZE) {
            await new Promise<void>((resolve) => (signal = resolve));
            continue;
          }

          const newSamples = audioBuffer.slice(processedLength);
          processedLength = audioBuffer.length;

          const event = voiceDetector.detectVoiceOnStream(newSamples, options?.vadOptions);
          switch (event) {
            case 'speechStart':
              isSpeaking = true;
              break;
            case 'speechEnd':
              isSpeaking = false;
              currentText = await transcribe(audioBuffer.slice(0, processedLength), options);
              commit();
              yield { committed: committedText, nonCommitted: '' };
              continue;
          }

          if (isSpeaking) {
            currentText = await transcribe(audioBuffer.slice(0, processedLength), options);
            if (processedLength >= maxSamples) commit();
            yield { committed: committedText, nonCommitted: currentText };
          } else {
            const retainSamples = Math.min(audioBuffer.length, STRIDE_SIZE);
            audioBuffer = audioBuffer.slice(audioBuffer.length - retainSamples);
            processedLength = audioBuffer.length;
            yield { committed: committedText, nonCommitted: '' };
          }
        }

        if (isSpeaking && audioBuffer.length > 0) {
          currentText = await transcribe(audioBuffer, options);
          commit();
          yield { committed: committedText, nonCommitted: '' };
        }
      } finally {
        signal = null;
        isStreaming = false;
        voiceDetector.resetStream();
        audioBuffer = new Float32Array(0);
      }
    }

    return {
      dispose,
      transcribe,
      transcribeWorklet,
      transcribeStop,
      stream,
      streamStop,
      streamInsert,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
