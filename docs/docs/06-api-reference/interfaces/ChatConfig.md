# Interface: ChatConfig

Defined in: [types/llm.ts:218](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L218)

Object configuring chat management.

## Properties

### contextStrategy

> **contextStrategy**: [`ContextStrategy`](ContextStrategy.md)

Defined in: [types/llm.ts:221](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L221)

Defines a strategy for managing the conversation context window and message history.

---

### initialMessageHistory

> **initialMessageHistory**: [`Message`](Message.md)[]

Defined in: [types/llm.ts:219](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L219)

An array of `Message` objects that represent the conversation history. This can be used to provide initial context to the model.

---

### systemPrompt

> **systemPrompt**: `string`

Defined in: [types/llm.ts:220](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L220)

Often used to tell the model what is its purpose, for example - "Be a helpful translator".
