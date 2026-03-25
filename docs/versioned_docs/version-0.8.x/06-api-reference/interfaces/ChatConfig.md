# Interface: ChatConfig

Defined in: [types/llm.ts:300](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L300)

Object configuring chat management.

## Properties

### contextStrategy

> **contextStrategy**: [`ContextStrategy`](ContextStrategy.md)

Defined in: [types/llm.ts:303](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L303)

Defines a strategy for managing the conversation context window and message history.

***

### initialMessageHistory

> **initialMessageHistory**: [`Message`](Message.md)[]

Defined in: [types/llm.ts:301](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L301)

An array of `Message` objects that represent the conversation history. This can be used to provide initial context to the model.

***

### systemPrompt

> **systemPrompt**: `string`

Defined in: [types/llm.ts:302](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L302)

Often used to tell the model what is its purpose, for example - "Be a helpful translator".
