# Interface: ContextStrategy

Defined in: [packages/react-native-executorch/src/types/llm.ts:259](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/llm.ts#L259)

Defines a strategy for managing the conversation context window and message history.

## Methods

### buildContext()

> **buildContext**(`systemPrompt`, `history`, `maxContextLength`, `getTokenCount`): [`Message`](Message.md)[]

Defined in: [packages/react-native-executorch/src/types/llm.ts:268](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/llm.ts#L268)

Constructs the final array of messages to be sent to the model for the current inference step.

-

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
