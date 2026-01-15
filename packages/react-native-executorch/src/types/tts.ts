import { ResourceSource } from './common';

// List all the languages available in TTS models (as lang shorthands)
export type TextToSpeechLanguage =
  | 'en-us' // American English
  | 'en-gb'; // British English

/**
 * Voice configuration
 *
 * So far in Kokoro, each voice is directly associated with a language.
 *
 * @property {TextToSpeechLanguage} lang - speaker's language
 * @property {ResourceSource} voiceSource - a source to a binary file with voice embedding
 * @property {KokoroVoiceExtras} [extra] - an optional extra sources or properties related to specific voice
 */
export interface VoiceConfig {
  lang: TextToSpeechLanguage;
  voiceSource: ResourceSource;
  extra?: KokoroVoiceExtras; // ... add more possible types
}

// Kokoro-specific voice extra props
export interface KokoroVoiceExtras {
  taggerSource: ResourceSource;
  lexiconSource: ResourceSource;
}

/**
 * Kokoro model configuration.
 * Only the core Kokoro model sources, as phonemizer sources are included in voice configuration.
 */
export interface KokoroConfig {
  type: 'kokoro';
  durationPredictorSource: ResourceSource;
  f0nPredictorSource: ResourceSource;
  textEncoderSource: ResourceSource;
  textDecoderSource: ResourceSource;
}

/**
 * Extra options associated with the Kokoro model
 *
 * @property {'small' | 'medium' | 'large'} fixedModel - if set, forces Kokoro to use only one if it's 3 models
 *                                 with static input shapes. Reduces the memory usage and
 *                                 inference time variance, but could affect the result quality a little bit.
 */
export interface KokoroOptions {
  fixedModel?: 'small' | 'medium' | 'large';
}

/**
 * General Text to Speech module configuration
 *
 * @property {KokoroConfig} model - a selected T2S model
 * @property {VoiceConfig} voice - a selected speaker's voice
 * @property {KokoroOptions} [options] - a completely optional model-specific configuration
 */
export interface TextToSpeechConfig {
  model: KokoroConfig; // ... add other model types in the future
  voice: VoiceConfig;
  options?: KokoroOptions; // ... add other model options in the future
}

/**
 * Text to Speech module input definition
 *
 * @property {string} text - a text to be spoken
 * @property {number} [speed] - optional speed argument - the higher it is, the faster the speech becomes
 */
export interface TextToSpeechInput {
  text: string;
  speed?: number;
}

/**
 * Text to Speech streaming input definition
 *
 * Streaming mode in T2S is synchronized by passing specific callbacks
 * executed at given moments of the streaming.
 * Actions such as playing the audio should happen within the onNext callback.
 * Callbacks can be both synchronous or asynchronous.
 * @property {() => void | Promise<void>} [onBegin] - Called when streaming begins
 * @property {(audio: Float32Array) => void | Promise<void>} [onNext] - Called after each audio chunk gets calculated.
 * @property {() => void | Promise<void>} [onEnd] - Called when streaming ends
 */
export interface TextToSpeechStreamingInput extends TextToSpeechInput {
  onBegin?: () => void | Promise<void>;
  onNext?: (audio: Float32Array) => void | Promise<void>;
  onEnd?: () => void | Promise<void>;
}
