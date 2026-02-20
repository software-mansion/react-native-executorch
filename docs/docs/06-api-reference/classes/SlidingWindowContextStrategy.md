# Class: SlidingWindowContextStrategy

Defined in: [packages/react-native-executorch/src/utils/llms/context_strategy/SlidingWindowContextStrategy.ts:12](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/llms/context_strategy/SlidingWindowContextStrategy.ts#L12)

An advanced, token-aware context strategy that dynamically trims the message history
to ensure it fits within the model's physical context limits.

- This strategy calculates the exact token count of the formatted prompt. If the prompt
  exceeds the allowed token budget (`maxContextLength` - `bufferTokens`), it recursively
  removes the oldest messages.

## Implements

- [`ContextStrategy`](../interfaces/ContextStrategy.md)

## Constructors

### Constructor

> **new SlidingWindowContextStrategy**(`bufferTokens`, `allowOrphanedAssistantMessages`): `SlidingWindowContextStrategy`

Defined in: [packages/react-native-executorch/src/utils/llms/context_strategy/SlidingWindowContextStrategy.ts:19](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/llms/context_strategy/SlidingWindowContextStrategy.ts#L19)

Initializes the SlidingWindowContextStrategy.

#### Parameters

##### bufferTokens

`number`

The number of tokens to keep free for the model's generated response (e.g., 1000).

##### allowOrphanedAssistantMessages

`boolean` = `false`

Whether to allow orphaned assistant messages when trimming the history.
If false, the strategy will ensure that an assistant message is not left without its preceding user message.

#### Returns

`SlidingWindowContextStrategy`

## Methods

### buildContext()

> **buildContext**(`systemPrompt`, `history`, `maxContextLength`, `getTokenCount`): [`Message`](../interfaces/Message.md)[]

Defined in: [packages/react-native-executorch/src/utils/llms/context_strategy/SlidingWindowContextStrategy.ts:34](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/llms/context_strategy/SlidingWindowContextStrategy.ts#L34)

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
