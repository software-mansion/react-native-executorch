# Interface: ChatConfig

Defined in: [packages/react-native-executorch/src/types/llm.ts:168](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/llm.ts#L168)

Object configuring chat management.

## Properties

### contextWindowLength

> **contextWindowLength**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:170](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/llm.ts#L170)

The number of messages from the current conversation that the model will use to generate a response. The higher the number, the more context the model will have. Keep in mind that using larger context windows will result in longer inference time and higher memory usage.

***

### initialMessageHistory

> **initialMessageHistory**: [`Message`](Message.md)[]

Defined in: [packages/react-native-executorch/src/types/llm.ts:169](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/llm.ts#L169)

An array of `Message` objects that represent the conversation history. This can be used to provide initial context to the model.

***

### systemPrompt

> **systemPrompt**: `string`

Defined in: [packages/react-native-executorch/src/types/llm.ts:171](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/llm.ts#L171)

Often used to tell the model what is its purpose, for example - "Be a helpful translator".
