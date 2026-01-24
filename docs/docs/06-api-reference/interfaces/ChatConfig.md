# Interface: ChatConfig

Defined in: [packages/react-native-executorch/src/types/llm.ts:154](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/llm.ts#L154)

Object configuring chat management.

## Properties

### contextWindowLength

> **contextWindowLength**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:163](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/llm.ts#L163)

The number of messages from the current conversation that the model will use to generate a response. The higher the number, the more context the model will have. Keep in mind that using larger context windows will result in longer inference time and higher memory usage.

***

### initialMessageHistory

> **initialMessageHistory**: [`Message`](Message.md)[]

Defined in: [packages/react-native-executorch/src/types/llm.ts:158](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/llm.ts#L158)

An array of `Message` objects that represent the conversation history. This can be used to provide initial context to the model.

***

### systemPrompt

> **systemPrompt**: `string`

Defined in: [packages/react-native-executorch/src/types/llm.ts:168](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/llm.ts#L168)

Often used to tell the model what is its purpose, for example - "Be a helpful translator".
