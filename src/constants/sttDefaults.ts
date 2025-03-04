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

export const MODEL_CONFIGS = {
  moonshine: {
    sources: {
      encoder: MOONSHINE_TINY_ENCODER,
      decoder: MOONSHINE_TINY_DECODER,
    },
    tokenizer: {
      source: MOONSHINE_TOKENIZER,
      sos: 1,
      eos: 2,
      special_char: '\u2581',
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
      special_char: 'Ġ',
    },
  },
};
