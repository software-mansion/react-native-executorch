# Type Alias: LLMChatSessionOptions

> **LLMChatSessionOptions** = `object`

Defined in: [extensions/llm/tasks/llmChatSession.ts:64](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L64)

Options for configuring an LLM chat session.

## Properties

### generationConfig?

> `readonly` `optional` **generationConfig**: [`LLMGenerationConfig`](../react-native-executorch/namespaces/llm/type-aliases/LLMGenerationConfig.md)

Defined in: [extensions/llm/tasks/llmChatSession.ts:66](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L66)

Default generation configuration options.

---

### initialMessages?

> `readonly` `optional` **initialMessages**: readonly [`ChatMessage`](../react-native-executorch/namespaces/llm/type-aliases/ChatMessage.md)[]

Defined in: [extensions/llm/tasks/llmChatSession.ts:68](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L68)

Initial conversation history to prefill into the model KV cache.

---

### resetOnTurn?

> `readonly` `optional` **resetOnTurn**: `boolean`

Defined in: [extensions/llm/tasks/llmChatSession.ts:77](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L77)

When true, disables append-only KV cache diffing and resets/prefills the
runner on every turn. Defaults to `false`.

---

### stopRegex?

> `readonly` `optional` **stopRegex**: `RegExp`

Defined in: [extensions/llm/tasks/llmChatSession.ts:70](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L70)

Optional regex pattern used to stop generation early when matched.

---

### toolOpts?

> `readonly` `optional` **toolOpts**: [`LLMToolOpts`](LLMToolOpts.md)

Defined in: [extensions/llm/tasks/llmChatSession.ts:72](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L72)

Tool calling configuration options.
