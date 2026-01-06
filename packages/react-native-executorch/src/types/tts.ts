import { ResourceSource } from './common';

// List all the languages available in TTS models
// The values should match the one used within the native side.
export enum TextToSpeechLanguage {
  EN_US = 0,
  EN_GB = 1,
}

// Voice configuration
// So far in Kokoro, each voice is directly associated with a language.
// The 'data' field corresponds to (usually) binary file with voice tensor.
export interface VoiceConfig {
  language: TextToSpeechLanguage;
  data: ResourceSource;
  extra?: Record<string, unknown>;
}

// Individual model configurations
// - Kokoro Configuration (including Phonemis tagger resource)
export interface KokoroConfig {
  durationPredictorSource: ResourceSource;
  f0nPredictorSource: ResourceSource;
  textEncoderSource: ResourceSource;
  textDecoderSource: ResourceSource;
}

// Model + voice configurations
export interface TextToSpeechConfig {
  model: KokoroConfig; // ... add other model types in the future
  voice?: VoiceConfig;
}

export interface TextToSpeechInput {
  text: string;
  speed?: number;
}

export interface TextToSpeechStreamingInput extends TextToSpeechInput {
  onBegin?: () => void | Promise<void>;
  onNext?: (audio: Float32Array) => void | Promise<void>;
  onEnd?: () => void | Promise<void>;
}
