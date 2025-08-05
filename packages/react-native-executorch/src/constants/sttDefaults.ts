import {
  MOONSHINE_TINY,
  WHISPER_TINY,
  WHISPER_TINY_MULTILINGUAL,
} from './modelUrls';
import { AvailableModels, ModelConfig } from '../types/stt';

export const SAMPLE_RATE = 16_000;
export const SECOND = SAMPLE_RATE;
export const HAMMING_DIST_THRESHOLD = 1;

const whisperTinyModelConfig = {
  sources: {
    encoder: WHISPER_TINY.encoderSource,
    decoder: WHISPER_TINY.decoderSource,
  },
  tokenizer: {
    source: WHISPER_TINY.tokenizerSource,
    bos: 50257, // FIXME: this is a placeholder and needs to be changed
    eos: 50256, // FIXME: this is a placeholder and needs to be changed
  },
  isMultilingual: false,
};

const moonshineTinyModelConfig = {
  sources: {
    encoder: MOONSHINE_TINY.encoderSource,
    decoder: MOONSHINE_TINY.decoderSource,
  },
  tokenizer: {
    source: MOONSHINE_TINY.tokenizerSource,
    bos: 1, // FIXME: this is a placeholder and needs to be changed
    eos: 2, // FIXME: this is a placeholder and needs to be changed
  },
  isMultilingual: false,
};

const whisperTinyMultilingualModelConfig = {
  sources: {
    encoder: WHISPER_TINY_MULTILINGUAL.encoderSource,
    decoder: WHISPER_TINY_MULTILINGUAL.decoderSource,
  },
  tokenizer: {
    source: WHISPER_TINY_MULTILINGUAL.tokenizerSource,
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

export const NUM_TOKENS_TO_TRIM = 3;

export enum STREAMING_ACTION {
  START,
  DATA,
  STOP,
}

export { AvailableModels };
