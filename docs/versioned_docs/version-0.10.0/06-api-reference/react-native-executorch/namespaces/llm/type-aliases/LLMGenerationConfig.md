# Type Alias: LLMGenerationConfig

> **LLMGenerationConfig** = `object`

Defined in: [extensions/llm/llmRunner.ts:15](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L15)

**`Experimental`**

Configuration options for LLM text generation.
This API is experimental and might change in future releases.

## Properties

### echo?

> `readonly` `optional` **echo**: `boolean`

Defined in: [extensions/llm/llmRunner.ts:17](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L17)

Whether to echo the prompt in the generated output.

---

### ignoreEos?

> `readonly` `optional` **ignoreEos**: `boolean`

Defined in: [extensions/llm/llmRunner.ts:19](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L19)

Whether to ignore EOS tokens during generation.

---

### maxNewTokens?

> `readonly` `optional` **maxNewTokens**: `number`

Defined in: [extensions/llm/llmRunner.ts:21](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L21)

Maximum number of new tokens to generate.

---

### temperature?

> `readonly` `optional` **temperature**: `number`

Defined in: [extensions/llm/llmRunner.ts:23](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L23)

Sampling temperature for token selection.
