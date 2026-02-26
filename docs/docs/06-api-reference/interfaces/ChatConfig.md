# Interface: ChatConfig

Defined in: [types/llm.ts:203](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L203)

Object configuring chat management.

## Properties

### contextStrategy

> **contextStrategy**: [`ContextStrategy`](ContextStrategy.md)

Defined in: [types/llm.ts:206](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L206)

Defines a strategy for managing the conversation context window and message history.

---

### initialMessageHistory

> **initialMessageHistory**: [`Message`](Message.md)[]

Defined in: [types/llm.ts:204](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L204)

An array of `Message` objects that represent the conversation history. This can be used to provide initial context to the model.

---

### systemPrompt

> **systemPrompt**: `string`

Defined in: [types/llm.ts:205](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L205)

Often used to tell the model what is its purpose, for example - "Be a helpful translator".
