import {
  MOONSHINE_TINY_ENCODER,
  MOONSHINE_TINY_DECODER,
  MOONSHINE_TOKENIZER,
  WHISPER_TINY_ENCODER,
  WHISPER_TINY_DECODER,
  WHISPER_TOKENIZER,
  WHISPER_TINY_MULTILINGUAL_ENCODER,
  WHISPER_TINY_MULTILINGUAL_DECODER,
  WHISPER_TINY_MULTILINGUAL_TOKENIZER,
} from './modelUrls';
import { AvailableModels, ModelConfig } from '../types/stt';

export const SAMPLE_RATE = 16_000;
export const SECOND = SAMPLE_RATE;
export const HAMMING_DIST_THRESHOLD = 1;

const whisperTinyModelConfig = {
  sources: {
    encoder: WHISPER_TINY_ENCODER,
    decoder: WHISPER_TINY_DECODER,
  },
  tokenizer: {
    source: WHISPER_TOKENIZER,
    bos: 50257, // FIXME: this is a placeholder and needs to be changed
    eos: 50256, // FIXME: this is a placeholder and needs to be changed
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
    bos: 1, // FIXME: this is a placeholder and needs to be changed
    eos: 2, // FIXME: this is a placeholder and needs to be changed
  },
  isMultilingual: false,
};

const whisperTinyMultilingualModelConfig = {
  sources: {
    encoder: WHISPER_TINY_MULTILINGUAL_ENCODER,
    decoder: WHISPER_TINY_MULTILINGUAL_DECODER,
  },
  tokenizer: {
    source: WHISPER_TINY_MULTILINGUAL_TOKENIZER,
    bos: 50258, // FIXME: this is a placeholder and needs to be changed
    eos: 50257, // FIXME: this is a placeholder and needs to be changed
  },
  isMultilingual: true,
};

export const MODEL_CONFIGS: {
  [key in AvailableModels]: ModelConfig;
} = {
  moonshine: moonshineTinyModelConfig,
  whisper: whisperTinyModelConfig,
  whisperMultilingual: whisperTinyMultilingualModelConfig,
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

export const NUM_TOKENS_TO_SLICE = 3;

export enum STREAMING_ACTION {
  START,
  DATA,
  STOP,
}

export enum SLICING_PLACE {
  START,
  MIDDLE,
  END,
}
