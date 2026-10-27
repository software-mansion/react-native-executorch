# Type Alias: ChatPreprocessorConfig

> **ChatPreprocessorConfig** = `object`

Defined in: [extensions/llm/utils/chatPreprocessor.ts:80](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L80)

Options for instantiating a ChatPreprocessor.

## Properties

### bosToken?

> `readonly` `optional` **bosToken**: `string`

Defined in: [extensions/llm/utils/chatPreprocessor.ts:84](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L84)

Beginning-of-sequence token exposed to the chat template.

---

### chatTemplate

> `readonly` **chatTemplate**: `string`

Defined in: [extensions/llm/utils/chatPreprocessor.ts:82](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L82)

Jinja chat template string for prompt rendering.

---

### eosToken?

> `readonly` `optional` **eosToken**: `string`

Defined in: [extensions/llm/utils/chatPreprocessor.ts:86](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L86)

End-of-sequence token exposed to the chat template.

---

### modalities?

> `readonly` `optional` **modalities**: readonly [`Modality`](Modality.md)[]

Defined in: [extensions/llm/utils/chatPreprocessor.ts:90](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L90)

Supported input modalities (e.g. `['image']`).

---

### preprocessorConfig?

> `readonly` `optional` **preprocessorConfig**: [`LLMMediaPreprocessorConfig`](LLMMediaPreprocessorConfig.md)

Defined in: [extensions/llm/utils/chatPreprocessor.ts:92](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L92)

Media preprocessing configuration for non-text inputs.

---

### tools?

> `readonly` `optional` **tools**: readonly [`ToolDefinition`](ToolDefinition.md)[]

Defined in: [extensions/llm/utils/chatPreprocessor.ts:88](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L88)

Tool definitions available to the model.
