# Type Alias: LLMToolOpts

> **LLMToolOpts** = `object`

Defined in: [extensions/llm/tasks/llmChatSession.ts:51](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L51)

Configuration options for tool calling in an LLM chat session.

## Properties

### maxToolTurns?

> `readonly` `optional` **maxToolTurns**: `number`

Defined in: [extensions/llm/tasks/llmChatSession.ts:57](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L57)

Maximum consecutive tool execution turns to prevent runaway loops. Defaults to `5`.

---

### parseToolCalls

> `readonly` **parseToolCalls**: [`ToolParser`](../react-native-executorch/namespaces/llm/type-aliases/ToolParser.md)

Defined in: [extensions/llm/tasks/llmChatSession.ts:55](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L55)

Parser function to extract tool calls from generated output.

---

### tools

> `readonly` **tools**: readonly [`ToolDefinition`](../react-native-executorch/namespaces/llm/type-aliases/ToolDefinition.md)[]

Defined in: [extensions/llm/tasks/llmChatSession.ts:53](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L53)

Tool definitions available to the model.
