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
   * Contains the part of the transcription that is finalized and will not change.
   * Useful for displaying stable results during streaming.
   */
  committedTranscription: string;

  /**
   * Contains the part of the transcription that is still being processed and may change.
   * Useful for displaying live, partial results during streaming.
   */
  nonCommittedTranscription: string;

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
   * @param options - Decoding options, e.g. `{ language: 'es' }` for multilingual models.
   * @returns Resolves a promise with the output transcription when the model is finished.
   */
  transcribe(
    waveform: Float32Array,
    options?: DecodingOptions | undefined
  ): Promise<string>;

  /**
   * Starts a streaming transcription process.
   * Use in combination with streamInsert to feed audio chunks and streamStop to end the stream.
   * Updates `committedTranscription` and `nonCommittedTranscription` as transcription progresses.
   * @param options - Decoding options including language.
   * @returns The final transcription string.
   */
  stream(options?: DecodingOptions | undefined): Promise<string>;

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
 */
export interface DecodingOptions {
  language?: SpeechToTextLanguage;
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
