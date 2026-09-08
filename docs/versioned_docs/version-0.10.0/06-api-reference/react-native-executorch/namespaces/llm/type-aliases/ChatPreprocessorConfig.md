# Type Alias: ChatPreprocessorConfig

> **ChatPreprocessorConfig** = `object`

Defined in: [extensions/llm/utils/chatPreprocessor.ts:80](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L80)

Options for instantiating a ChatPreprocessor.

## Properties

### chatTemplate

> `readonly` **chatTemplate**: `string`

Defined in: [extensions/llm/utils/chatPreprocessor.ts:82](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L82)

Jinja chat template string for prompt rendering.

---

### modalities?

> `readonly` `optional` **modalities**: readonly [`Modality`](Modality.md)[]

Defined in: [extensions/llm/utils/chatPreprocessor.ts:86](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L86)

Supported input modalities (e.g. `['image']`).

---

### preprocessorConfig?

> `readonly` `optional` **preprocessorConfig**: [`LLMMediaPreprocessorConfig`](LLMMediaPreprocessorConfig.md)

Defined in: [extensions/llm/utils/chatPreprocessor.ts:88](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L88)

Media preprocessing configuration for non-text inputs.

---

### tools?

> `readonly` `optional` **tools**: readonly [`ToolDefinition`](ToolDefinition.md)[]

Defined in: [extensions/llm/utils/chatPreprocessor.ts:84](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L84)

Tool definitions available to the model.
