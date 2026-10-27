# Type Alias: LLMModel

> **LLMModel** = `object`

Defined in: [extensions/llm/tasks/llmChatSession.ts:34](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L34)

Model configuration required to instantiate an LLM chat session.

## Properties

### modalities?

> `readonly` `optional` **modalities**: readonly [`Modality`](../react-native-executorch/namespaces/llm/type-aliases/Modality.md)[]

Defined in: [extensions/llm/tasks/llmChatSession.ts:42](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L42)

Supported input non-text modalities (e.g. `['image']`).

---

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/llm/tasks/llmChatSession.ts:36](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L36)

Local path or remote URL of the `.pte` model file.

---

### preprocessorConfig?

> `readonly` `optional` **preprocessorConfig**: [`LLMMediaPreprocessorConfig`](../react-native-executorch/namespaces/llm/type-aliases/LLMMediaPreprocessorConfig.md)

Defined in: [extensions/llm/tasks/llmChatSession.ts:44](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L44)

Media preprocessor configuration.

---

### tokenizerConfigPath

> `readonly` **tokenizerConfigPath**: `string`

Defined in: [extensions/llm/tasks/llmChatSession.ts:40](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L40)

Local path or remote URL of the `tokenizer_config.json` file.

---

### tokenizerPath

> `readonly` **tokenizerPath**: `string`

Defined in: [extensions/llm/tasks/llmChatSession.ts:38](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L38)

Local path or remote URL of the `tokenizer.json` file.
