import type { Model } from '../../../core/model';
import type { Tokenizer } from '../../nlp';
import type { LLMRunner } from '../llmRunner';

export function createLLMGemmaRunner(model: Model, tokenizer: Tokenizer): LLMRunner {
  throw new Error(`Not implemented ${model.path}, ${tokenizer.path}`);
}
