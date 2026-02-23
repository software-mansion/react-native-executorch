# Class: NoopContextStrategy

Defined in: [packages/react-native-executorch/src/utils/llms/context_strategy/NoopContextStrategy.ts:10](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/utils/llms/context_strategy/NoopContextStrategy.ts#L10)

A context strategy that performs no filtering or trimming of the message history.

- This strategy is ideal when the developer wants to manually manage the conversation
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

Defined in: [packages/react-native-executorch/src/utils/llms/context_strategy/NoopContextStrategy.ts:20](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/utils/llms/context_strategy/NoopContextStrategy.ts#L20)

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
