# Type Alias: LLMChatTurnResult

> **LLMChatTurnResult** = `object`

Defined in: [extensions/llm/tasks/llmChatSession.ts:84](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L84)

Result returned by an LLM chat turn.

## Properties

### finishReason

> `readonly` **finishReason**: `"stop"` \| `"cancelled"` \| `"maxToolTurns"`

Defined in: [extensions/llm/tasks/llmChatSession.ts:95](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L95)

Reason why the chat turn completed.

- `stop`: The model completed its answer naturally without further tool calls.
- `cancelled`: The session was stopped and the current turn was discarded.
- `maxToolTurns`: The turn was terminated because it reached `maxToolTurns`.

---

### messages

> `readonly` **messages**: readonly [`ChatMessage`](../react-native-executorch/namespaces/llm/type-aliases/ChatMessage.md)[]

Defined in: [extensions/llm/tasks/llmChatSession.ts:86](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L86)

The messages added to history during this chat turn.

---

### stats

> `readonly` **stats**: readonly [`LLMGenerationStats`](../react-native-executorch/namespaces/llm/type-aliases/LLMGenerationStats.md)[]

Defined in: [extensions/llm/tasks/llmChatSession.ts:88](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L88)

Generation performance statistics for each generation step in this turn.
