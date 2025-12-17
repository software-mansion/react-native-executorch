import { ResourceSource } from './common';

// List all the languages available in TTS models
export type TextToSpeechLanguage = 'en_gb' | 'en_us';

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
