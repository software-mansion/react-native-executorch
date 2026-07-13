import { Template } from '@huggingface/jinja';

import type { ChatFormatter } from './tasks/llmChatSession';

/** Configuration options for the Jinja chat formatter. */
export type JinjaFormatterOptions = {
  readonly bosToken?: string;
  readonly extraContext?: Record<string, unknown>;
};

/**
 * Creates a chat formatter function that renders messages using a Jinja template.
 * @param chatTemplate The Jinja template string (e.g. from tokenizer_config.json).
 * @param options Jinja formatter options.
 * @returns A ChatFormatter function.
 */
export function createJinjaChatFormatter(
  chatTemplate: string,
  options: JinjaFormatterOptions = {}
): ChatFormatter {
  const { bosToken = '', extraContext } = options;
  const template = new Template(chatTemplate);

  return (message, { isFirst }) => {
    const isGenerationPrompt = message.role === 'assistant' && message.content === '';
    return template.render({
      // Only the first prefill of a conversation should carry the BOS token;
      // later turns append to the model's existing KV cache.
      // eslint-disable-next-line camelcase
      bos_token: isFirst ? bosToken : '',
      // eslint-disable-next-line camelcase
      add_generation_prompt: isGenerationPrompt,
      messages: isGenerationPrompt ? [] : [{ role: message.role, content: message.content }],
      ...extraContext,
    });
  };
}
