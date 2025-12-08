import { ResourceSource } from './common';

export interface TextToSpeechInput {
  text: string;
  speed: number;
};

export interface TextToSpeechKokoroConfig {
  durationPredictorSource: ResourceSource;
  f0nPredictorSource: ResourceSource;
  textEncoderSource: ResourceSource;
  textDecoderSource: ResourceSource;
  voice: ResourceSource;
};