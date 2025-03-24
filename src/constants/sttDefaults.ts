import {
  MOONSHINE_TINY_ENCODER,
  MOONSHINE_TINY_DECODER,
  MOONSHINE_TOKENIZER,
  WHISPER_TINY_ENCODER,
  WHISPER_TINY_DECODER,
  WHISPER_TOKENIZER,
} from './modelUrls';

export const SAMPLE_RATE = 16_000;
export const SECOND = SAMPLE_RATE;
export const HAMMING_DIST_THRESHOLD = 1;

export interface ModelConfig {
  sources: {
    encoder: string;
    decoder: string;
  };
  tokenizer: {
    source: string;
    sos: number;
    eos: number;
    specialChar: string;
  };
}

export const MODEL_CONFIGS: { [key in 'moonshine' | 'whisper']: ModelConfig } =
  {
    moonshine: {
      sources: {
        encoder: MOONSHINE_TINY_ENCODER,
        decoder: MOONSHINE_TINY_DECODER,
      },
      tokenizer: {
        source: MOONSHINE_TOKENIZER,
        sos: 1,
        eos: 2,
        specialChar: '\u2581',
      },
    },
    whisper: {
      sources: {
        encoder: WHISPER_TINY_ENCODER,
        decoder: WHISPER_TINY_DECODER,
      },
      tokenizer: {
        source: WHISPER_TOKENIZER,
        sos: 50257,
        eos: 50256,
        specialChar: 'Ġ',
      },
    },
  };

export const MODES = {
  fast: {
    windowSize: 5,
    overlapSeconds: 1.2,
  },
  balanced: {
    windowSize: 12,
    overlapSeconds: 2,
  },
  quality: {
    windowSize: 24,
    overlapSeconds: 3,
  },
};
