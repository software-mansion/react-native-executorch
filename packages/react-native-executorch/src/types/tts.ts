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
  | 'es' // Spanish
  | 'it' // Italian
  | 'pt' // Portuguese
  | 'de' // German
  | 'pl' // Polish
  | 'hi'; // Hindi

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
 * Configuration for a specific model and voice in a Text-to-Speech module.
 * @category Types
 * @property {TextToSpeechModelSources} model - The model sources and identifiers.
 * @property {ResourceSource} voiceSource - The resource containing the voice-specific tensor stored in a binary format.
 * @property {TextToSpeechPhonemizerConfig} phonemizerConfig - The phonemizer configuration to be used with this voice.
 */
export interface TextToSpeechModelConfig {
  model: TextToSpeechModelSources;
  voiceSource: ResourceSource;
  phonemizerConfig: TextToSpeechPhonemizerConfig;
}

/**
 * Props for the `useTextToSpeech` hook.
 * @category Types
 * @property {TextToSpeechModelConfig} model - The Kokoro voice / model bundle to load.
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
 */
export interface TextToSpeechProps {
  model: TextToSpeechModelConfig;
  preventLoad?: boolean;
}

/**
 * Text to Speech module input definition
 * @category Types
 * @property {string} text - a text to be spoken
 * @property {number} [speed] - optional speed argument - the higher it is, the faster the speech becomes
 * @property {boolean} [phonemize] - if true (default), the input is treated as text and converted to phonemes.
 *                                   If false, the input should already be in IPA phonemes.
 */
export interface TextToSpeechInput {
  text?: string;
  speed?: number;
  phonemize?: boolean;
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
   * Inserts a new text chunk into the buffer to be processed in streaming mode.
   *
   * Chunks accumulate until an end-of-sentence character (`.?!;…`) appears in
   * the buffer, at which point they're partitioned and synthesized. If the
   * caller stops feeding before an EOS arrives, the trailing tail will sit in
   * the buffer until `streamFlush()` or `streamStop(false)` is called.
   * @param textChunk - Text (or IPA phonemes) to append to the streaming buffer.
   */
  streamInsert: (textChunk: string) => void;

  /**
   * Requests the streaming session to partition and synthesize whatever is
   * currently buffered, even if no end-of-sentence character is present.
   *
   * Call after the final `streamInsert` of an utterance when you want
   * trailing un-terminated content to play out without ending the stream.
   * LLM-style callers feeding partial tokens typically should not call this —
   * model punctuation drives natural EOS partitioning, and the residual tail
   * is drained by `streamStop(false)` when generation completes.
   */
  streamFlush: () => void;

  /**
   * Interrupts and stops the currently active audio generation stream.
   * @param instant If true, stops the streaming as soon as possible. Otherwise
   *                drains the current buffer (force-flushing any trailing
   *                un-terminated content) before stopping — equivalent to
   *                calling {@link TextToSpeechType.streamFlush} followed by an
   *                automatic stop once the buffer empties, so this call
   *                always returns.
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
