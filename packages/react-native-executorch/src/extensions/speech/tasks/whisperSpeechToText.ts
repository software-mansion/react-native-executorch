/**
 * Whisper Speech-to-Text (STT) transcription and live-streaming task pipeline.
 * @module Speech/Tasks/WhisperSpeechToText
 */

import type { WorkletRuntime } from 'react-native-worklets';
import { scheduleOnRN, createSynchronizable } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { wrapAsync } from '../../../core/runtime';
import { f32, i64, method, validateSpec, DynamicDim as Dyn } from '../../../core/schema';

import { argmax } from '../../../extensions/math';
import { loadTokenizer } from '../../nlp/tokenizer';
import {
  createFsmnVoiceActivityDetector,
  type FsmnVadModel,
  type VadStreamOptions,
} from './fsmnVoiceActivityDetection';
import { RnExecuTorchError } from '../../../core/error';

/**
 * Sample rate (Hz) Whisper models expect their input waveform to be at.
 * @category Speech / Constants
 */
export const WHISPER_SAMPLE_RATE_HZ = 16000;

const MAX_SEQ_LEN = 128; // maximum decoder output tokens per chunk
const MIN_CHUNK_SIZE = 201; // shortest audio slice (samples) the model was exported for
const CHUNK_LENGTH_SECONDS = 29; // Whisper's fixed context window length
const STRIDE_SIZE = 1 * WHISPER_SAMPLE_RATE_HZ; // minimum new samples before processing and retain-window size during silence (1s)
const BUFFER_SIZE = CHUNK_LENGTH_SECONDS * WHISPER_SAMPLE_RATE_HZ; // samples per full chunk

/**
 * Language codes supported by Whisper multilingual models. English-only
 * model variants only accept `'en'`.
 * @category Speech / Constants
 */
// prettier-ignore
export const WHISPER_LANGUAGES = [
  'en', 'zh', 'de', 'es', 'ru', 'ko', 'fr', 'ja', 'pt', 'tr',
  'pl', 'ca', 'nl', 'ar', 'sv', 'it', 'id', 'hi', 'fi', 'vi',
  'he', 'uk', 'el', 'ms', 'cs', 'ro', 'da', 'hu', 'ta', 'no',
  'th', 'ur', 'hr', 'bg', 'lt', 'la', 'mi', 'ml', 'cy', 'sk',
  'te', 'fa', 'lv', 'bn', 'sr', 'az', 'sl', 'kn', 'et', 'mk',
  'br', 'eu', 'is', 'hy', 'ne', 'mn', 'bs', 'kk', 'sq', 'sw',
  'gl', 'mr', 'pa', 'si', 'km', 'sn', 'yo', 'so', 'af', 'oc',
  'ka', 'be', 'tg', 'sd', 'gu', 'am', 'yi', 'lo', 'uz', 'fo',
  'ht', 'ps', 'tk', 'nn', 'mt', 'sa', 'lb', 'my', 'bo', 'tl',
  'mg', 'as', 'tt', 'haw', 'ln', 'ha', 'ba', 'jw', 'su', 'yue'
] as const;

/**
 * Union type of all language codes supported by Whisper. Derived from
 * {@link WHISPER_LANGUAGES}.
 * @category Speech / Types
 */
export type WhisperLanguage = (typeof WHISPER_LANGUAGES)[number];

/**
 * Options passed to a single transcription call.
 * @category Speech / Types
 */
export type WhisperSttOptions<L extends WhisperLanguage = WhisperLanguage> = {
  /**
   * Whisper language code of the spoken audio. Must be one of
   * the {@link WhisperLanguage} values declared in the model's
   * `supportedLanguages` list.
   */
  readonly language: L;
};

/**
 * Options for the live-streaming transcription API.
 * Extends {@link WhisperSttOptions} with optional VAD tuning.
 * @category Speech / Types
 */
export type WhisperStreamOptions<L extends WhisperLanguage = WhisperLanguage> =
  WhisperSttOptions<L> & {
    /**
     * Fine-tuning knobs forwarded to the voice-activity detector. Omit to use
     * built-in defaults.
     */
    readonly vadOptions?: VadStreamOptions;
  };

/**
 * Paths and metadata required to instantiate a Whisper speech-to-text model.
 * @category Speech / Types
 */
export type WhisperSttModel<L extends WhisperLanguage = WhisperLanguage> = {
  /** Local path or remote URL of the `.pte` model. */
  readonly modelPath: string;
  /** Local path or remote URL of the tokenizer file. */
  readonly tokenizerPath: string;
  /** List of supported language codes for this model. */
  readonly supportedLanguages: readonly L[];
  /** VAD model configuration used for speech segmentation. */
  readonly vadModel: FsmnVadModel;
};

/**
 * Whisper speech-to-text task runner.
 * @category Speech / Types
 * @typeParam L The language type accepted by the model.
 */
export type WhisperSpeechToText<L extends WhisperLanguage = WhisperLanguage> = {
  /**
   * Releases all allocated native resources.
   */
  readonly dispose: () => void;

  /**
   * Asynchronously transcribes a pre-recorded mono waveform sampled at
   * {@link WHISPER_SAMPLE_RATE_HZ}.
   * @param audio Raw 16 kHz mono PCM audio samples (Float32Array).
   * @param options Transcription options. See {@link WhisperSttOptions}.
   * @param onToken Optional callback fired on the RN thread for each decoded
   * token.
   * @returns A promise resolving to the full transcript string.
   * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if the language is
   * unsupported, `RESOURCE_BUSY` if the model is in use, or `RESOURCE_DISPOSED`
   * if disposed.
   */
  readonly transcribe: (
    audio: Float32Array,
    options: WhisperSttOptions<L>,
    onToken?: (token: string) => void
  ) => Promise<string>;

  /**
   * Synchronous version of {@link transcribe} to be executed directly on the
   * caller or worklet thread.
   */
  readonly transcribeWorklet: (
    audio: Float32Array,
    options: WhisperSttOptions<L>,
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
   * See {@link WhisperStreamOptions}.
   * @returns An AsyncGenerator yielding transcript updates.
   * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if the language is
   * unsupported, `RESOURCE_BUSY` if the model is in use, or `RESOURCE_DISPOSED`
   * if disposed.
   */
  readonly stream: (
    options: WhisperStreamOptions<L>
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
 * Loads a Whisper model and returns a set of transcription helpers.
 * @category Speech / Tasks
 * @typeParam L Supported language codes constraint.
 * @param config Model paths, supported-language metadata, and VAD
 * configuration.
 * See {@link WhisperSttModel}.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to the instantiated {@link WhisperSpeechToText}
 * runner.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if the model, tokenizer,
 * or VAD fails to load, or `SCHEMA_MISMATCH` if model schemas do not match the
 * Whisper specification.
 */
export async function createWhisperSpeechToText<L extends WhisperLanguage = WhisperLanguage>(
  config: WhisperSttModel<L>,
  runtime?: WorkletRuntime
): Promise<WhisperSpeechToText<L>> {
  const { modelPath, tokenizerPath, supportedLanguages, vadModel } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);
  const tokenizer = await wrapAsync(loadTokenizer, runtime)(tokenizerPath);
  const voiceDetector = await createFsmnVoiceActivityDetector(vadModel, runtime);

  const eotToken = tokenizer.tokenToId('<|endoftext|>')!;
  const isEnglishOnly = supportedLanguages.length === 1 && supportedLanguages[0] === 'en';

  const { dims } = validateSpec(model.schema, {
    default: {
      ...method(
        'encode', // prettier-ignore
        [f32(Dyn('T_audio'))], // Internally, model always pads audio to the maximum duration.
        [f32(1, 'SeqLen', 'StateDim')]
      ),
      ...method(
        'decode',
        [i64(1, 1), i64(1), f32(1, 'SeqLen', 'StateDim')],
        [f32(1, 1, 'VocabSize')]
      ),
    },
  });

  const [seqLen, stateDim] = dims.constant('SeqLen', 'StateDim');

  const tensors = [
    tensor('int64', [1]), // tPosition
    tensor('int64', [1, 1]), // tToken
    tensor('int32', [1, 1, 1]), // tArgmax
    tensor('float32', [1, seqLen, stateDim]), //tEncodings
    tensor('float32', [1, 1, tokenizer.getVocabSize()]), // tLogits
  ] as const;

  const [tPosition, tToken, tArgmax, tEncodings, tLogits] = tensors;
  const isCancelled = createSynchronizable(false);

  const dispose = () => {
    tensors.forEach((t) => t.dispose());
    voiceDetector.dispose();
    tokenizer.dispose();
    model.dispose();
  };

  const decode = (token: number, position: number): number => {
    'worklet';
    tPosition.setData(new BigInt64Array([BigInt(position)]));
    tToken.setData(new BigInt64Array([BigInt(token)]));
    model.execute('decode', [tToken, tPosition, tEncodings], [tLogits]);
    return tLogits.through(argmax, tArgmax).getData(new Int32Array(1))[0]!;
  };

  const transcribeWorklet = (
    audio: Float32Array,
    options: WhisperSttOptions<L>,
    onToken?: (token: string) => void
  ): string => {
    'worklet';
    isCancelled.setBlocking(false);

    const promptTokenStrings = isEnglishOnly
      ? ['<|startoftranscript|>', '<|notimestamps|>']
      : ['<|startoftranscript|>', `<|${options.language}|>`, '<|transcribe|>', '<|notimestamps|>'];

    if (!isEnglishOnly && tokenizer.tokenToId(`<|${options.language}|>`) === undefined) {
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        `Language "${options.language}" is not recognized.`
      );
    }
    const promptTokens = promptTokenStrings.map((token) => tokenizer.tokenToId(token));
    const maxNewTokens = MAX_SEQ_LEN - promptTokens.length;

    let text = '';
    let offset = 0;

    while (offset < audio.length) {
      if (isCancelled.getBlocking()) break;

      const audioChunk = audio.slice(offset, Math.min(offset + BUFFER_SIZE, audio.length));
      if (audioChunk.length < MIN_CHUNK_SIZE) {
        break;
      }

      const tAudioInput = tensor('float32', [audioChunk.length], audioChunk);
      try {
        model.execute('encode', [tAudioInput], [tEncodings]);
      } finally {
        tAudioInput.dispose();
      }

      let nextToken = eotToken;
      let position = promptTokens.length;
      promptTokens.forEach((token, pos) => (nextToken = decode(token, pos)));

      const generated: number[] = [];
      while (generated.length < maxNewTokens && nextToken !== eotToken) {
        if (isCancelled.getBlocking()) break;

        generated.push(nextToken);
        if (onToken) scheduleOnRN(onToken, tokenizer.decode(Int32Array.of(nextToken)));
        nextToken = decode(nextToken, position);
        position++;
      }

      text += tokenizer.decode(Int32Array.from(generated));
      offset += BUFFER_SIZE;
    }

    return text.trim();
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
    options: WhisperStreamOptions<L>
  ): AsyncGenerator<{ committed: string; nonCommitted: string }> {
    if (isStreaming) {
      throw RnExecuTorchError('INVALID_STATE', 'Streaming is already in progress');
    }
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

        const event = voiceDetector.detectVoiceOnStream(newSamples, options.vadOptions);
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
          if (processedLength >= BUFFER_SIZE) commit();
          yield { committed: committedText, nonCommitted: currentText };
        } else {
          const retainSamples = Math.min(audioBuffer.length, STRIDE_SIZE);
          audioBuffer = audioBuffer.slice(audioBuffer.length - retainSamples);
          processedLength = audioBuffer.length;
          yield { committed: committedText, nonCommitted: '' };
        }
      }

      if (isSpeaking && audioBuffer.length >= MIN_CHUNK_SIZE) {
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
}
