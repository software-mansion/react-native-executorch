import type { Model } from '../../../core/model';
import type { Tokenizer } from '../../nlp';
import type { LLMRunner } from '../llmRunner';

export function createLLMMultimodalRunner(model: Model, tokenizer: Tokenizer): LLMRunner {
  void model;
  void tokenizer;
  throw new Error('Not implemented');
}
