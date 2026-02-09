# Interface: ChatConfig

Defined in: [packages/react-native-executorch/src/types/llm.ts:218](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/llm.ts#L218)

Object configuring chat management.

## Properties

### contextWindowLength

> **contextWindowLength**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:220](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/llm.ts#L220)

The number of messages from the current conversation that the model will use to generate a response. The higher the number, the more context the model will have. Keep in mind that using larger context windows will result in longer inference time and higher memory usage.

---

### initialMessageHistory

> **initialMessageHistory**: [`Message`](Message.md)[]

Defined in: [packages/react-native-executorch/src/types/llm.ts:219](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/llm.ts#L219)

An array of `Message` objects that represent the conversation history. This can be used to provide initial context to the model.

---

### systemPrompt

> **systemPrompt**: `string`

Defined in: [packages/react-native-executorch/src/types/llm.ts:221](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/llm.ts#L221)

Often used to tell the model what is its purpose, for example - "Be a helpful translator".
