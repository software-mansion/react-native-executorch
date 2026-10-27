# Type Alias: TokenizerChatConfig

> **TokenizerChatConfig** = `object`

Defined in: [extensions/llm/utils/tokenizerConfig.ts:12](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/tokenizerConfig.ts#L12)

Model chat template configuration resolved from tokenizer config file.

## Properties

### bosToken?

> `readonly` `optional` **bosToken**: `string`

Defined in: [extensions/llm/utils/tokenizerConfig.ts:16](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/tokenizerConfig.ts#L16)

Beginning-of-sequence token string, when configured.

---

### chatTemplate

> `readonly` **chatTemplate**: `string`

Defined in: [extensions/llm/utils/tokenizerConfig.ts:14](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/tokenizerConfig.ts#L14)

Jinja chat template string for prompt rendering.

---

### eosToken

> `readonly` **eosToken**: `string`

Defined in: [extensions/llm/utils/tokenizerConfig.ts:18](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/tokenizerConfig.ts#L18)

End-of-sequence token string.

---

### stopTokens

> `readonly` **stopTokens**: readonly `string`[]

Defined in: [extensions/llm/utils/tokenizerConfig.ts:22](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/tokenizerConfig.ts#L22)

Every terminal token the model may decode into its output.
