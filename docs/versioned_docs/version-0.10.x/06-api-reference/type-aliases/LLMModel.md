# Type Alias: LLMModel

> **LLMModel** = `object`

Defined in: [extensions/llm/tasks/llmChatSession.ts:33](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L33)

Model configuration required to instantiate an LLM chat session.

## Properties

### modalities?

> `readonly` `optional` **modalities**: readonly [`Modality`](../react-native-executorch/namespaces/llm/type-aliases/Modality.md)[]

Defined in: [extensions/llm/tasks/llmChatSession.ts:41](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L41)

Supported input non-text modalities (e.g. `['image']`).

---

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/llm/tasks/llmChatSession.ts:35](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L35)

Local path or remote URL of the `.pte` model file.

---

### preprocessorConfig?

> `readonly` `optional` **preprocessorConfig**: [`LLMMediaPreprocessorConfig`](../react-native-executorch/namespaces/llm/type-aliases/LLMMediaPreprocessorConfig.md)

Defined in: [extensions/llm/tasks/llmChatSession.ts:43](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L43)

Media preprocessor configuration.

---

### tokenizerConfigPath

> `readonly` **tokenizerConfigPath**: `string`

Defined in: [extensions/llm/tasks/llmChatSession.ts:39](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L39)

Local path or remote URL of the `tokenizer_config.json` file.

---

### tokenizerPath

> `readonly` **tokenizerPath**: `string`

Defined in: [extensions/llm/tasks/llmChatSession.ts:37](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L37)

Local path or remote URL of the `tokenizer.json` file.
