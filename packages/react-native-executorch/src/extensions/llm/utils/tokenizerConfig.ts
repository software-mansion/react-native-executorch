/**
 * Parser for HuggingFace `tokenizer_config.json` chat templates and special
 * tokens.
 * @module LLM/Utils/TokenizerConfig
 */

import { RnExecuTorchError } from '../../../core/error';

/**
 * Model chat template configuration resolved from tokenizer config file.
 * @category LLM / Types
 */
export type TokenizerChatConfig = {
  /** Jinja chat template string for prompt rendering. */
  readonly chatTemplate: string;
  /** End-of-sequence token string. */
  readonly eosToken: string;
};

function resolveToken(token: unknown): string | undefined {
  if (typeof token === 'string') return token;
  if (token && typeof token === 'object' && typeof (token as any).content === 'string') {
    return (token as any).content;
  }
  return undefined;
}

/**
 * Parses raw JSON configuration from `tokenizer_config.json` into a normalized format.
 * @category LLM / Functions
 * @param config Raw JSON object from tokenizer_config.json.
 * @returns A parsed TokenizerChatConfig object.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if `chat_template` is not
 * a string or `eos_token` is missing.
 */
export function parseTokenizerConfig(config: any): TokenizerChatConfig {
  let chatTemplate = config.chat_template;

  // Some models ship multiple named templates as `[{ name, template }]`.
  if (Array.isArray(chatTemplate)) {
    const entry = chatTemplate.find((t) => t?.name === 'default') ?? chatTemplate[0];
    chatTemplate = entry?.template;
  }

  if (typeof chatTemplate !== 'string') {
    throw RnExecuTorchError(
      'LOAD_FAILED',
      'tokenizer_config.json does not contain a string `chat_template`'
    );
  }

  const eosToken = resolveToken(config.eos_token);

  if (!eosToken) {
    throw RnExecuTorchError(
      'LOAD_FAILED',
      'tokenizer_config.json does not define required `eos_token` string'
    );
  }

  return { chatTemplate, eosToken };
}
