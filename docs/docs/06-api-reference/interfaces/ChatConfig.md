# Interface: ChatConfig

Defined in: [packages/react-native-executorch/src/types/llm.ts:155](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/types/llm.ts#L155)

Object configuring chat management.

## Properties

### contextWindowLength

> **contextWindowLength**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:164](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/types/llm.ts#L164)

The number of messages from the current conversation that the model will use to generate a response. The higher the number, the more context the model will have. Keep in mind that using larger context windows will result in longer inference time and higher memory usage.

---

### initialMessageHistory

> **initialMessageHistory**: [`Message`](Message.md)[]

Defined in: [packages/react-native-executorch/src/types/llm.ts:159](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/types/llm.ts#L159)

An array of `Message` objects that represent the conversation history. This can be used to provide initial context to the model.

---

### systemPrompt

> **systemPrompt**: `string`

Defined in: [packages/react-native-executorch/src/types/llm.ts:169](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/types/llm.ts#L169)

Often used to tell the model what is its purpose, for example - "Be a helpful translator".
