# Interface: ContextStrategy

Defined in: [types/llm.ts:338](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L338)

Defines a strategy for managing the conversation context window and message history.

## Methods

### buildContext()

> **buildContext**(`systemPrompt`, `history`, `maxContextLength`, `getTokenCount`): [`Message`](Message.md)[]

Defined in: [types/llm.ts:347](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L347)

Constructs the final array of messages to be sent to the model for the current inference step.

#### Parameters

##### systemPrompt

`string`

The top-level instructions or persona assigned to the model.

##### history

[`Message`](Message.md)[]

The complete conversation history up to the current point.

##### maxContextLength

`number`

The maximum number of tokens that the model can keep in the context.

##### getTokenCount

(`messages`) => `number`

A callback function provided by the LLM controller that calculates the exact number of tokens a specific array of messages will consume once formatted.

#### Returns

[`Message`](Message.md)[]

The optimized array of messages, ready to be processed by the model.
