/** Model chat template configuration resolved from tokenizer config file. */
export type TokenizerChatConfig = {
  readonly chatTemplate: string;
  readonly bosToken?: string;
  readonly eosToken?: string;
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
 * @param config Raw JSON object from tokenizer_config.json.
 * @returns A parsed TokenizerChatConfig object.
 */
export function parseTokenizerConfig(config: any): TokenizerChatConfig {
  let chatTemplate = config?.chat_template;

  // Some models ship multiple named templates as `[{ name, template }]`.
  if (Array.isArray(chatTemplate)) {
    const entry = chatTemplate.find((t) => t?.name === 'default') ?? chatTemplate[0];
    chatTemplate = entry?.template;
  }

  if (typeof chatTemplate !== 'string') {
    throw new Error('tokenizer_config.json does not contain a string `chat_template`');
  }

  return {
    chatTemplate,
    bosToken: resolveToken(config?.bos_token),
    eosToken: resolveToken(config?.eos_token),
  };
}
