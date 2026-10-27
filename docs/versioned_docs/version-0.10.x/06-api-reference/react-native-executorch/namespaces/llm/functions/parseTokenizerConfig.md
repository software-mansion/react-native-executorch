# Function: parseTokenizerConfig()

> **parseTokenizerConfig**(`config`): [`TokenizerChatConfig`](../type-aliases/TokenizerChatConfig.md)

Defined in: [extensions/llm/utils/tokenizerConfig.ts:35](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/tokenizerConfig.ts#L35)

Parses raw JSON configuration from `tokenizer_config.json` into a normalized format.

## Parameters

### config

`any`

Raw JSON object from tokenizer_config.json.

## Returns

[`TokenizerChatConfig`](../type-aliases/TokenizerChatConfig.md)

A parsed TokenizerChatConfig object.

## Throws

With code `LOAD_FAILED` if `chat_template` is not
a string or `eos_token` is missing.
