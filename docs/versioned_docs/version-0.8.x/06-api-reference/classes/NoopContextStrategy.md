# Class: NoopContextStrategy

Defined in: [utils/llms/context\_strategy/NoopContextStrategy.ts:9](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/utils/llms/context_strategy/NoopContextStrategy.ts#L9)

A context strategy that performs no filtering or trimming of the message history.
This strategy is ideal when the developer wants to manually manage the conversation
context.

## Implements

- [`ContextStrategy`](../interfaces/ContextStrategy.md)

## Constructors

### Constructor

> **new NoopContextStrategy**(): `NoopContextStrategy`

#### Returns

`NoopContextStrategy`

## Methods

### buildContext()

> **buildContext**(`systemPrompt`, `history`, `_maxContextLength`, `_getTokenCount`): [`Message`](../interfaces/Message.md)[]

Defined in: [utils/llms/context\_strategy/NoopContextStrategy.ts:18](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/utils/llms/context_strategy/NoopContextStrategy.ts#L18)

Builds the context by prepending the system prompt to the entire unfiltered history.

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

The unedited message history with the system prompt at the beginning.

#### Implementation of

[`ContextStrategy`](../interfaces/ContextStrategy.md).[`buildContext`](../interfaces/ContextStrategy.md#buildcontext)
