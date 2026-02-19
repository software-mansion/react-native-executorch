import { ResourceSource } from './common';
import { RnExecutorchError } from '../errors/errorUtils';

/**
 * Configuration for Speech to Text model.
 *
 * @category Types
 */
export interface SpeechToTextProps {
  /**
   * Configuration object containing model sources.
   */
  model: SpeechToTextModelConfig;
  /**
   * Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
   */
  preventLoad?: boolean;
}

/**
 * React hook for managing Speech to Text (STT) instance.
 *
 * @category Types
 */
export interface SpeechToTextType {
  /**
   * Contains the error message if the model failed to load.
   */
  error: null | RnExecutorchError;

  /**
   * Indicates whether the model has successfully loaded and is ready for inference.
   */
  isReady: boolean;

  /**
   * Indicates whether the model is currently processing an inference.
   */
  isGenerating: boolean;

  /**
   * Tracks the progress of the model download process.
   */
  downloadProgress: number;

  /**
   * Runs the encoding part of the model on the provided waveform.
   * @param waveform - The input audio waveform array.
   * @returns A promise resolving to the encoded data.
   */
  encode(waveform: Float32Array): Promise<Float32Array>;

  /**
   * Runs the decoder of the model.
   * @param tokens - The encoded audio data.
   * @param encoderOutput - The output from the encoder.
   * @returns A promise resolving to the decoded text.
   */
  decode(
    tokens: Int32Array,
    encoderOutput: Float32Array
  ): Promise<Float32Array>;

  /**
   * Starts a transcription process for a given input array, which should be a waveform at 16kHz.
   * @param waveform - The input audio waveform.
   * @param options - Decoding options, check API reference for more details.
   * @returns Resolves a promise with the output transcription. Result of transcription is
   * object of type `TranscriptionResult`.
   */
  transcribe(
    waveform: Float32Array,
    options?: DecodingOptions | undefined
  ): Promise<TranscriptionResult>;

  /**
   * Starts a streaming transcription process.
   * Use in combination with `streamInsert` to feed audio chunks and `streamStop` to end the stream.
   * Updates `committedTranscription` and `nonCommittedTranscription` as transcription progresses.
   * @param options - Decoding options including language.
   * @returns Asynchronous generator that returns `committed` and `nonCommitted` transcription.
   * Both `committed` and `nonCommitted` are of type `TranscriptionResult`
   */
  stream(options?: DecodingOptions | undefined): AsyncGenerator<
    {
      committed: TranscriptionResult;
      nonCommitted: TranscriptionResult;
    },
    void,
    unknown
  >;

  /**
   * Inserts a chunk of audio data (sampled at 16kHz) into the ongoing streaming transcription.
   * @param waveform - The audio chunk to insert.
   */
  streamInsert(waveform: Float32Array): void;

  /**
   * Stops the ongoing streaming transcription process.
   */
  streamStop(): void;
}

/**
 * Languages supported by whisper (not whisper.en)
 *
 * @category Types
 */
export type SpeechToTextLanguage =
  | 'af'
  | 'sq'
  | 'ar'
  | 'hy'
  | 'az'
  | 'eu'
  | 'be'
  | 'bn'
  | 'bs'
  | 'bg'
  | 'my'
  | 'ca'
  | 'zh'
  | 'hr'
  | 'cs'
  | 'da'
  | 'nl'
  | 'et'
  | 'en'
  | 'fi'
  | 'fr'
  | 'gl'
  | 'ka'
  | 'de'
  | 'el'
  | 'gu'
  | 'ht'
  | 'he'
  | 'hi'
  | 'hu'
  | 'is'
  | 'id'
  | 'it'
  | 'ja'
  | 'kn'
  | 'kk'
  | 'km'
  | 'ko'
  | 'lo'
  | 'lv'
  | 'lt'
  | 'mk'
  | 'mg'
  | 'ms'
  | 'ml'
  | 'mt'
  | 'mr'
  | 'ne'
  | 'no'
  | 'fa'
  | 'pl'
  | 'pt'
  | 'pa'
  | 'ro'
  | 'ru'
  | 'sr'
  | 'si'
  | 'sk'
  | 'sl'
  | 'es'
  | 'su'
  | 'sw'
  | 'sv'
  | 'tl'
  | 'tg'
  | 'ta'
  | 'te'
  | 'th'
  | 'tr'
  | 'uk'
  | 'ur'
  | 'uz'
  | 'vi'
  | 'cy'
  | 'yi';

/**
 * Options for decoding speech to text.
 *
 * @category Types
 * @property {SpeechToTextLanguage} [language] - Optional language code to guide the transcription.
 * @property {boolean} [verbose] - Optional flag. If set, transcription result is presented with timestamps
 * and with additional parameters. For more details please refer to `TranscriptionResult`.
 */
export interface DecodingOptions {
  language?: SpeechToTextLanguage;
  verbose?: boolean;
}

/**
 * Structure that represent single token with timestamp information.
 *
 * @category Types
 * @property {string} [word] - Token as a string value.
 * @property {number} [start] - Timestamp of the beginning of the token in audio (in seconds).
 * @property {number} [end] - Timestamp of the end of the token in audio (in seconds).
 */
export interface Word {
  word: string;
  start: number;
  end: number;
}

/**
 * Structure that represent single Segment of transcription.
 *
 * @category Types
 * @property {number} [start] - Timestamp of the beginning of the segment in audio (in seconds).
 * @property {number} [end] - Timestamp of the end of the segment in audio (in seconds).
 * @property {string} [text] - Full text of the given segment as a string.
 * @property {Word[]} [words] - If `verbose` set to `true` in `DecodingOptions`, it returns word-level timestamping
 * as an array of `Word`.
 * @property {number[]} [tokens] - Raw tokens represented as table of integers.
 * @property {number} [temperature] - Temperature for which given segment was computed.
 * @property {number} [avgLogprob] - Average log probability calculated across all tokens in a segment.
 * @property {number} [compressionRatio] - Compression ration achieved on a given segment.
 */
export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  words?: Word[];
  tokens: number[];
  temperature: number;
  avgLogprob: number;
  compressionRatio: number;
}

/**
 * Structure that represent result of transcription for a one function call (either `transcribe` or `stream`).
 *
 * @category Types
 * @property {'transcribe' | 'stream'} [task] - String indicating task, either 'transcribe' or 'stream'.
 * @property {string} [language] - Language chosen for transcription.
 * @property {number} [duration] - Duration in seconds of a given transcription.
 * @property {string} [text] - The whole text of a transcription as a `string`.
 * @property {TranscriptionSegment[]} [segments] - If `verbose` set to `true` in `DecodingOptions`, it contains array of
 * `TranscriptionSegment` with details split into separate transcription segments.
 */
export interface TranscriptionResult {
  task?: 'transcribe' | 'stream';
  language: string;
  duration: number;
  text: string;
  segments?: TranscriptionSegment[]; // Present if verbose=true
}

/**
 * Configuration for Speech to Text model.
 *
 * @category Types
 */
export interface SpeechToTextModelConfig {
  /**
   * A boolean flag indicating whether the model supports multiple languages.
   */
  isMultilingual: boolean;

  /**
   * A string that specifies the location of a `.pte` file for the encoder.
   */
  encoderSource: ResourceSource;

  /**
   * A string that specifies the location of a `.pte` file for the decoder.
   */
  decoderSource: ResourceSource;

  /**
   * A string that specifies the location to the tokenizer for the model.
   */
  tokenizerSource: ResourceSource;
}
