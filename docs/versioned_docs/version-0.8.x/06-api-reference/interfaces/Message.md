# Interface: Message

Defined in: [types/llm.ts:264](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L264)

Represents a message in the conversation.

## Properties

### content

> **content**: `string`

Defined in: [types/llm.ts:266](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L266)

Content of the message.

***

### mediaPath?

> `optional` **mediaPath**: `string`

Defined in: [types/llm.ts:271](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L271)

Optional local file path to media (image, audio, etc.).
Only valid on `user` messages.

***

### role

> **role**: [`MessageRole`](../type-aliases/MessageRole.md)

Defined in: [types/llm.ts:265](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L265)

Role of the message sender of type `MessageRole`.
