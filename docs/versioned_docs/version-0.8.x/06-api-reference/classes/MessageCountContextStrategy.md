# Class: MessageCountContextStrategy

Defined in: [utils/llms/context\_strategy/MessageCountContextStrategy.ts:8](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/utils/llms/context_strategy/MessageCountContextStrategy.ts#L8)

A simple context strategy that retains a fixed number of the most recent messages.
This strategy trims the conversation history based purely on the message count.

## Implements

- [`ContextStrategy`](../interfaces/ContextStrategy.md)

## Constructors

### Constructor

> **new MessageCountContextStrategy**(`windowLength?`): `MessageCountContextStrategy`

Defined in: [utils/llms/context\_strategy/MessageCountContextStrategy.ts:13](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/utils/llms/context_strategy/MessageCountContextStrategy.ts#L13)

Initializes the MessageCountContextStrategy.

#### Parameters

##### windowLength?

`number` = `5`

The maximum number of recent messages to retain in the context. Defaults to 5.

#### Returns

`MessageCountContextStrategy`

## Methods

### buildContext()

> **buildContext**(`systemPrompt`, `history`, `_maxContextLength`, `_getTokenCount`): [`Message`](../interfaces/Message.md)[]

Defined in: [utils/llms/context\_strategy/MessageCountContextStrategy.ts:23](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/utils/llms/context_strategy/MessageCountContextStrategy.ts#L23)

Builds the context by slicing the history to retain only the most recent `windowLength` messages.

#### Parameters

##### systemPrompt

`string`

The top-level instructions for the model.

##### history

[`Message`](../interfaces/Message.md)[]

The complete conversation history.

##### \_maxContextLength

`number`

Unused in this strategy.

##### \_getTokenCount

(`messages`) => `number`

Unused in this strategy.

#### Returns

[`Message`](../interfaces/Message.md)[]

The truncated message history with the system prompt at the beginning.

#### Implementation of

[`ContextStrategy`](../interfaces/ContextStrategy.md).[`buildContext`](../interfaces/ContextStrategy.md#buildcontext)
