import { ResourceSource } from './common';
import { RnExecutorchError } from '../errors/errorUtils';

/**
 * Per-model config for {@link TextToSpeechModule.fromModelName}.
 * Each model name maps to its required fields.
 * @category Types
 */
export type TextToSpeechModelSources = {
  modelName: 'kokoro';
  durationPredictorSource: ResourceSource;
  synthesizerSource: ResourceSource;
};

/**
 * Union of all built-in Text to Speech model names.
 * @category Types
 */
export type TextToSpeechModelName = TextToSpeechModelSources['modelName'];

/**
 * List all the languages available in TTS models (as lang shorthands)
 * @category Types
 */
export type TextToSpeechLanguage =
  | 'en-us' // American English
  | 'en-gb' // British English
  | 'fr' // French
  | 'es'; // Spanish

/**
 * Configuration for the Phonemizer used in Text-to-Speech models.
 * Phonemization is the process of converting text into phonetic representations.
 * @category Types
 */
export interface TextToSpeechPhonemizerConfig {
  /**
   * The language code for phonemization (e.g., 'en-us').
   */
  lang: TextToSpeechLanguage;

  /**
   * Optional resource for the part-of-speech tagger.
   * Utilized by more challenging languages, such as english.
   */
  taggerSource?: ResourceSource;

  /**
   * Optional resource for the pronunciation lexicon.
   * If provided, it wil be a primary phonemization mechanism.
   */
  lexiconSource?: ResourceSource;

  /**
   * Optional neural model resource for Grapheme-to-Phoneme conversion.
   * Serves as a fallback for lexicon or a primary phonemization mechanism if lexicon
   * is not defined.
   */
  neuralModelSource?: ResourceSource;
}

/**
 * Configuration for a specific voice in a Text-to-Speech model.
 * Maps a voice data file to its corresponding phonemizer settings.
 * @category Types
 * @property {ResourceSource} voiceSource - The resource containing the voice-specific tensor stored in a binary format.
 * @property {TextToSpeechPhonemizerConfig} phonemizerConfig - The phonemizer configuration to be used with this voice.
 */
export interface TextToSpeechVoiceConfig {
  voiceSource: ResourceSource;
  phonemizerConfig: TextToSpeechPhonemizerConfig;
}

/**
 * Properties for initializing a Text-to-Speech model component or hook.
 * @category Types
 * @template C - The specific model source configuration type.
 * @property {C} model - The model sources and identifiers.
 * @property {boolean} [preventLoad] - If true, prevents the model from loading automatically on initialization.
 */
export interface TextToSpeechModelProps<
  M extends TextToSpeechModelSources,
  V extends TextToSpeechVoiceConfig,
> {
  model: M;
  voice: V;
  preventLoad?: boolean;
}

/**
 * Text to Speech module input definition
 * @category Types
 * @property {string} text - a text to be spoken
 * @property {number} [speed] - optional speed argument - the higher it is, the faster the speech becomes
 */
export interface TextToSpeechInput {
  text?: string;
  speed?: number;
}

/**
 * Return type for the `useTextToSpeech` hook.
 * Manages the state and operations for Text-to-Speech generation.
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
   * @param input - The `TextToSpeechInput` object containing the `text` to synthesize and optional `speed`.
   * @returns A Promise that resolves with the generated audio data (typically a `Float32Array`).
   * @throws {RnExecutorchError} If the model is not loaded or is currently generating.
   */
  forward: (input: TextToSpeechInput) => Promise<Float32Array>;

  /**
   * Streams the generated audio data incrementally.
   * This is optimal for real-time playback, allowing audio to start playing before the full text is synthesized.
   * @param input - The `TextToSpeechStreamingInput` object containing `text`, optional `speed`, and lifecycle callbacks (`onBegin`, `onNext`, `onEnd`).
   * @returns A Promise that resolves when the streaming process is complete.
   * @throws {RnExecutorchError} If the model is not loaded or is currently generating.
   */
  stream: (input: TextToSpeechStreamingInput) => Promise<void>;

  /**
   * Inserts new text chunk into the buffer to be processed in streaming mode.
   */
  streamInsert: (textChunk: string) => void;

  /**
   * Interrupts and stops the currently active audio generation stream.
   * @param instant If true, stops the streaming as soon as possible. Otherwise
   *                allows the module to complete processing for the remains of the buffer.
   */
  streamStop: (instant?: boolean) => void;
}

/**
 * Shared streaming lifecycle callbacks for TTS streaming modes.
 * @category Types
 * @property {() => void | Promise<void>} [onBegin] - Called when streaming begins
 * @property {(audio: Float32Array) => void | Promise<void>} [onNext] - Called after each audio chunk gets calculated.
 * @property {() => void | Promise<void>} [onEnd] - Called when streaming ends
 */
export interface TextToSpeechStreamingCallbacks {
  onBegin?: () => void | Promise<void>;
  onNext?: (audio: Float32Array) => void | Promise<void>;
  onEnd?: () => void | Promise<void>;
}

/**
 * Text to Speech streaming input definition
 *
 * Streaming mode in T2S is synchronized by passing specific callbacks
 * executed at given moments of the streaming.
 * Actions such as playing the audio should happen within the onNext callback.
 * Callbacks can be both synchronous or asynchronous.
 *
 * Enables an incrementally expanded input, in other words adding
 * new text chunks with streamInsert() as the streaming is running.
 * @category Types
 * @property {boolean} [stopAutomatically] - If true, streaming will stop automatically when the buffer is empty.
 */
export interface TextToSpeechStreamingInput
  extends TextToSpeechInput, TextToSpeechStreamingCallbacks {
  stopAutomatically?: boolean;
}
