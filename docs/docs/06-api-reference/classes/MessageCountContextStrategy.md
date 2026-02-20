# Class: MessageCountContextStrategy

Defined in: [packages/react-native-executorch/src/utils/llms/context_strategy/MessageCountContextStrategy.ts:9](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/llms/context_strategy/MessageCountContextStrategy.ts#L9)

A simple context strategy that retains a fixed number of the most recent messages.
This strategy trims the conversation history based purely on the message count.

## Implements

- [`ContextStrategy`](../interfaces/ContextStrategy.md)

## Constructors

### Constructor

> **new MessageCountContextStrategy**(`windowLength`): `MessageCountContextStrategy`

Defined in: [packages/react-native-executorch/src/utils/llms/context_strategy/MessageCountContextStrategy.ts:14](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/llms/context_strategy/MessageCountContextStrategy.ts#L14)

Initializes the MessageCountContextStrategy.

-

#### Parameters

##### windowLength

`number` = `5`

The maximum number of recent messages to retain in the context. Defaults to 5.

#### Returns

`MessageCountContextStrategy`

## Methods

### buildContext()

> **buildContext**(`systemPrompt`, `history`, `_maxContextLength`, `_getTokenCount`): [`Message`](../interfaces/Message.md)[]

Defined in: [packages/react-native-executorch/src/utils/llms/context_strategy/MessageCountContextStrategy.ts:25](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/llms/context_strategy/MessageCountContextStrategy.ts#L25)

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
