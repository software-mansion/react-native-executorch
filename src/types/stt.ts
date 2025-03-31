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

export type AvailableModels = 'whisper' | 'moonshine' | 'whisperMultilingual';
