# Interface: ChatConfig

Defined in: [packages/react-native-executorch/src/types/llm.ts:207](https://github.com/software-mansion/react-native-executorch/blob/4ee3121e1a18c982703726f1f72421920ed523a4/packages/react-native-executorch/src/types/llm.ts#L207)

Object configuring chat management.

## Properties

### contextWindowLength

> **contextWindowLength**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:209](https://github.com/software-mansion/react-native-executorch/blob/4ee3121e1a18c982703726f1f72421920ed523a4/packages/react-native-executorch/src/types/llm.ts#L209)

The number of messages from the current conversation that the model will use to generate a response. The higher the number, the more context the model will have. Keep in mind that using larger context windows will result in longer inference time and higher memory usage.

---

### initialMessageHistory

> **initialMessageHistory**: [`Message`](Message.md)[]

Defined in: [packages/react-native-executorch/src/types/llm.ts:208](https://github.com/software-mansion/react-native-executorch/blob/4ee3121e1a18c982703726f1f72421920ed523a4/packages/react-native-executorch/src/types/llm.ts#L208)

An array of `Message` objects that represent the conversation history. This can be used to provide initial context to the model.

---

### systemPrompt

> **systemPrompt**: `string`

Defined in: [packages/react-native-executorch/src/types/llm.ts:210](https://github.com/software-mansion/react-native-executorch/blob/4ee3121e1a18c982703726f1f72421920ed523a4/packages/react-native-executorch/src/types/llm.ts#L210)

Often used to tell the model what is its purpose, for example - "Be a helpful translator".
