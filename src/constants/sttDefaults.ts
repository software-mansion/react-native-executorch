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
    bos: number;
    eos: number;
    specialChar: string;
  };
  isMultilingual: boolean;
}

const whisperTinyModelConfig = {
  sources: {
    encoder: WHISPER_TINY_ENCODER,
    decoder: WHISPER_TINY_DECODER,
  },
  tokenizer: {
    source: WHISPER_TOKENIZER,
    bos: 50257,
    eos: 50256,
    special_char: 'Ġ',
  },
  isMultilingual: false,
};

const moonshineTinyModelConfig = {
  sources: {
    encoder: MOONSHINE_TINY_ENCODER,
    decoder: MOONSHINE_TINY_DECODER,
  },
  tokenizer: {
    source: MOONSHINE_TOKENIZER,
    bos: 1,
    eos: 2,
    special_char: '\u2581',
  },
  isMultilingual: false,
};

export const MODEL_CONFIGS: {
  [key in 'moonshine' | 'whisper' | 'whisperMultilingual']: ModelConfig;
} = {
  moonshine: moonshineTinyModelConfig,
  whisper: whisperTinyModelConfig,
  whisperMultilingual: { ...whisperTinyModelConfig, isMultilingual: true },
};
