# Interface: ChatConfig

Defined in: [packages/react-native-executorch/src/types/llm.ts:218](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/llm.ts#L218)

Object configuring chat management.

## Properties

### contextStrategy

> **contextStrategy**: [`ContextStrategy`](ContextStrategy.md)

Defined in: [packages/react-native-executorch/src/types/llm.ts:221](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/llm.ts#L221)

Defines a strategy for managing the conversation context window and message history.

---

### initialMessageHistory

> **initialMessageHistory**: [`Message`](Message.md)[]

Defined in: [packages/react-native-executorch/src/types/llm.ts:219](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/llm.ts#L219)

An array of `Message` objects that represent the conversation history. This can be used to provide initial context to the model.

---

### systemPrompt

> **systemPrompt**: `string`

Defined in: [packages/react-native-executorch/src/types/llm.ts:220](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/llm.ts#L220)

Often used to tell the model what is its purpose, for example - "Be a helpful translator".
