# Interface: Message

Defined in: [types/llm.ts:282](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L282)

Represents a message in the conversation.

## Properties

### content

> **content**: `string`

Defined in: [types/llm.ts:284](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L284)

Content of the message.

---

### mediaPath?

> `optional` **mediaPath**: `string`

Defined in: [types/llm.ts:291](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L291)

Optional local file path to media (image, audio, etc.).
Only valid on `user` messages.
Either `file:///absolute/path` or `/absolute/path` is accepted; the
controller normalizes the path before passing it to native code.

---

### role

> **role**: [`MessageRole`](../type-aliases/MessageRole.md)

Defined in: [types/llm.ts:283](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L283)

Role of the message sender of type `MessageRole`.
