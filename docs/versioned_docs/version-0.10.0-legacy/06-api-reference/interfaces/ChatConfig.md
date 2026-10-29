# Interface: ChatConfig

Defined in: [types/llm.ts:320](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L320)

Object configuring chat management.

## Properties

### contextStrategy

> **contextStrategy**: [`ContextStrategy`](ContextStrategy.md)

Defined in: [types/llm.ts:323](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L323)

Defines a strategy for managing the conversation context window and message history.

---

### initialMessageHistory

> **initialMessageHistory**: [`Message`](Message.md)[]

Defined in: [types/llm.ts:321](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L321)

An array of `Message` objects that represent the conversation history. This can be used to provide initial context to the model.

---

### systemPrompt

> **systemPrompt**: `string`

Defined in: [types/llm.ts:322](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L322)

Often used to tell the model what is its purpose, for example - "Be a helpful translator".
