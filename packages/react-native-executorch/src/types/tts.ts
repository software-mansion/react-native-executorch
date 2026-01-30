import { ResourceSource } from './common';
import { RnExecutorchError } from '../errors/errorUtils';

/**
 * List all the languages available in TTS models (as lang shorthands)
 *
 * @category Types
 */
export type TextToSpeechLanguage =
  | 'en-us' // American English
  | 'en-gb'; // British English

/**
 * Voice configuration
 *
 * So far in Kokoro, each voice is directly associated with a language.
 *
 * @category Types
 * @property {TextToSpeechLanguage} lang - speaker's language
 * @property {ResourceSource} voiceSource - a source to a binary file with voice embedding
 * @property {KokoroVoiceExtras} [extra] - an optional extra sources or properties related to specific voice
 */
export interface VoiceConfig {
  lang: TextToSpeechLanguage;
  voiceSource: ResourceSource;
  extra?: KokoroVoiceExtras; // ... add more possible types
}

/**
 * Kokoro-specific voice extra props
 *
 * @category Types
 * @property {ResourceSource} taggerSource - source to Kokoro's tagger model binary
 * @property {ResourceSource} lexiconSource - source to Kokoro's lexicon binary
 */
export interface KokoroVoiceExtras {
  taggerSource: ResourceSource;
  lexiconSource: ResourceSource;
}

/**
 * Kokoro model configuration.
 * Only the core Kokoro model sources, as phonemizer sources are included in voice configuration.
 *
 * @category Types
 * @property {'kokoro'} type - model type identifier
 * @property {ResourceSource} durationPredictorSource - source to Kokoro's duration predictor model binary
 * @property {ResourceSource} synthesizerSource - source to Kokoro's synthesizer model binary
 */
export interface KokoroConfig {
  type: 'kokoro';
  durationPredictorSource: ResourceSource;
  synthesizerSource: ResourceSource;
}

/**
 * General Text to Speech module configuration
 *
 * @category Types
 * @property {KokoroConfig} model - a selected T2S model
 * @property {VoiceConfig} voice - a selected speaker's voice
 * @property {KokoroOptions} [options] - a completely optional model-specific configuration
 */
export interface TextToSpeechConfig {
  model: KokoroConfig; // ... add other model types in the future
  voice: VoiceConfig;
}

/**
 * Props for the useTextToSpeech hook.
 *
 * @category Types
 * @extends TextToSpeechConfig
 *
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
 */
export interface TextToSpeechProps extends TextToSpeechConfig {
  preventLoad?: boolean;
}

/**
 * Text to Speech module input definition
 *
 * @category Types
 * @property {string} text - a text to be spoken
 * @property {number} [speed] - optional speed argument - the higher it is, the faster the speech becomes
 */
export interface TextToSpeechInput {
  text: string;
  speed?: number;
}

/**
 * Return type for the `useTextToSpeech` hook.
 * Manages the state and operations for Text-to-Speech generation.
 *
 * @category Types
 */
export interface TextToSpeechType {
  /**
   * Contains the error object if the model failed to load or encountered an error during inference.
   */
  error: RnExecutorchError | null;

  /**
   * Indicates whether the Text-to-Speech model is loaded and ready to accept inputs.
   */
  isReady: boolean;

  /**
   * Indicates whether the model is currently generating audio.
   */
  isGenerating: boolean;

  /**
   * Represents the download progress of the model and voice assets as a value between 0 and 1.
   */
  downloadProgress: number;

  /**
   * Runs the model to convert the provided text into speech audio in a single pass.
   * * @param input - The `TextToSpeechInput` object containing the `text` to synthesize and optional `speed`.
   * @returns A Promise that resolves with the generated audio data (typically a `Float32Array`).
   * @throws {RnExecutorchError} If the model is not loaded or is currently generating.
   */
  forward: (input: TextToSpeechInput) => Promise<Float32Array>;

  /**
   * Streams the generated audio data incrementally.
   * This is optimal for real-time playback, allowing audio to start playing before the full text is synthesized.
   * * @param input - The `TextToSpeechStreamingInput` object containing `text`, optional `speed`, and lifecycle callbacks (`onBegin`, `onNext`, `onEnd`).
   * @returns A Promise that resolves when the streaming process is complete.
   * @throws {RnExecutorchError} If the model is not loaded or is currently generating.
   */
  stream: (input: TextToSpeechStreamingInput) => Promise<void>;

  /**
   * Interrupts and stops the currently active audio generation stream.
   */
  streamStop: () => void;
}

/**
 * Text to Speech streaming input definition
 *
 * Streaming mode in T2S is synchronized by passing specific callbacks
 * executed at given moments of the streaming.
 * Actions such as playing the audio should happen within the onNext callback.
 * Callbacks can be both synchronous or asynchronous.
 *
 * @category Types
 * @property {() => void | Promise<void>} [onBegin] - Called when streaming begins
 * @property {(audio: Float32Array) => void | Promise<void>} [onNext] - Called after each audio chunk gets calculated.
 * @property {() => void | Promise<void>} [onEnd] - Called when streaming ends
 */
export interface TextToSpeechStreamingInput extends TextToSpeechInput {
  onBegin?: () => void | Promise<void>;
  onNext?: (audio: Float32Array) => void | Promise<void>;
  onEnd?: () => void | Promise<void>;
}
