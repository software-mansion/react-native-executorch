# Type Alias: LLMChatTurnResult

> **LLMChatTurnResult** = `object`

Defined in: [extensions/llm/tasks/llmChatSession.ts:83](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L83)

Result returned by an LLM chat turn.

## Properties

### finishReason

> `readonly` **finishReason**: `"stop"` \| `"maxToolTurns"`

Defined in: [extensions/llm/tasks/llmChatSession.ts:93](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L93)

Reason why the chat turn completed.

- `stop`: The model completed its answer naturally without further tool calls.
- `maxToolTurns`: The turn was terminated because it reached `maxToolTurns`.

---

### messages

> `readonly` **messages**: readonly [`ChatMessage`](../react-native-executorch/namespaces/llm/type-aliases/ChatMessage.md)[]

Defined in: [extensions/llm/tasks/llmChatSession.ts:85](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L85)

The messages added to history during this chat turn.

---

### stats

> `readonly` **stats**: readonly [`LLMGenerationStats`](../react-native-executorch/namespaces/llm/type-aliases/LLMGenerationStats.md)[]

Defined in: [extensions/llm/tasks/llmChatSession.ts:87](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L87)

Generation performance statistics for each generation step in this turn.
