# Class: SlidingWindowContextStrategy

Defined in: [utils/llms/context_strategy/SlidingWindowContextStrategy.ts:11](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/utils/llms/context_strategy/SlidingWindowContextStrategy.ts#L11)

An advanced, token-aware context strategy that dynamically trims the message history
to ensure it fits within the model's physical context limits.
This strategy calculates the exact token count of the formatted prompt. If the prompt
exceeds the allowed token budget (`maxContextLength` - `bufferTokens`), it recursively
removes the oldest messages.

## Implements

- [`ContextStrategy`](../interfaces/ContextStrategy.md)

## Constructors

### Constructor

> **new SlidingWindowContextStrategy**(`bufferTokens`, `allowOrphanedAssistantMessages?`): `SlidingWindowContextStrategy`

Defined in: [utils/llms/context_strategy/SlidingWindowContextStrategy.ts:18](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/utils/llms/context_strategy/SlidingWindowContextStrategy.ts#L18)

Initializes the SlidingWindowContextStrategy.

#### Parameters

##### bufferTokens

`number`

The number of tokens to keep free for the model's generated response (e.g., 1000).

##### allowOrphanedAssistantMessages?

`boolean` = `false`

Whether to allow orphaned assistant messages when trimming the history.
If false, the strategy will ensure that an assistant message is not left without its preceding user message.

#### Returns

`SlidingWindowContextStrategy`

## Methods

### buildContext()

> **buildContext**(`systemPrompt`, `history`, `maxContextLength`, `getTokenCount`): [`Message`](../interfaces/Message.md)[]

Defined in: [utils/llms/context_strategy/SlidingWindowContextStrategy.ts:32](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/utils/llms/context_strategy/SlidingWindowContextStrategy.ts#L32)

Builds the context by recursively evicting the oldest messages until the total
token count is safely within the defined budget.

#### Parameters

##### systemPrompt

`string`

The top-level instructions for the model.

##### history

[`Message`](../interfaces/Message.md)[]

The complete conversation history.

##### maxContextLength

`number`

Unused in this strategy, as the strategy relies on token count rather than message count.

##### getTokenCount

(`messages`) => `number`

Callback to calculate the exact token count of the rendered template.

#### Returns

[`Message`](../interfaces/Message.md)[]

The optimized message history guaranteed to fit the token budget.

#### Implementation of

[`ContextStrategy`](../interfaces/ContextStrategy.md).[`buildContext`](../interfaces/ContextStrategy.md#buildcontext)
