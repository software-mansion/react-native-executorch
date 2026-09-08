# Type Alias: LLMChatSessionOptions

> **LLMChatSessionOptions** = `object`

Defined in: [extensions/llm/tasks/llmChatSession.ts:63](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L63)

Options for configuring an LLM chat session.

## Properties

### generationConfig?

> `readonly` `optional` **generationConfig**: [`LLMGenerationConfig`](../react-native-executorch/namespaces/llm/type-aliases/LLMGenerationConfig.md)

Defined in: [extensions/llm/tasks/llmChatSession.ts:65](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L65)

Default generation configuration options.

---

### initialMessages?

> `readonly` `optional` **initialMessages**: readonly [`ChatMessage`](../react-native-executorch/namespaces/llm/type-aliases/ChatMessage.md)[]

Defined in: [extensions/llm/tasks/llmChatSession.ts:67](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L67)

Initial conversation history to prefill into the model KV cache.

---

### resetOnTurn?

> `readonly` `optional` **resetOnTurn**: `boolean`

Defined in: [extensions/llm/tasks/llmChatSession.ts:76](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L76)

When true, disables append-only KV cache diffing and resets/prefills the
runner on every turn. Defaults to `false`.

---

### stopRegex?

> `readonly` `optional` **stopRegex**: `RegExp`

Defined in: [extensions/llm/tasks/llmChatSession.ts:69](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L69)

Optional regex pattern used to stop generation early when matched.

---

### toolOpts?

> `readonly` `optional` **toolOpts**: [`LLMToolOpts`](LLMToolOpts.md)

Defined in: [extensions/llm/tasks/llmChatSession.ts:71](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L71)

Tool calling configuration options.
