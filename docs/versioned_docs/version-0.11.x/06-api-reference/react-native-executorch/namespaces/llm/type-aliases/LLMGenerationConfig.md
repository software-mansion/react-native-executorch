# Type Alias: LLMGenerationConfig

> **LLMGenerationConfig** = [`SamplingConfig`](SamplingConfig.md) & `object`

Defined in: [extensions/llm/llmRunner.ts:29](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L29)

Configuration options for LLM text generation.

## Type Declaration

### enableThinking?

> `readonly` `optional` **enableThinking**: `boolean`

Sets `enable_thinking` in supported chat templates; ignored by raw runners.

### ignoreEos?

> `readonly` `optional` **ignoreEos**: `boolean`

Whether to ignore EOS tokens during generation.

### maxNewTokens?

> `readonly` `optional` **maxNewTokens**: `number`

Maximum number of new tokens to generate.

### prefillLen?

> `readonly` `optional` **prefillLen**: `number`

Maximum tokens per decoder prefill call. Defaults to the model's maximum sequence length.
