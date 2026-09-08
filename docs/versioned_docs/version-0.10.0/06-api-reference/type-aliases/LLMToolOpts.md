# Type Alias: LLMToolOpts

> **LLMToolOpts** = `object`

Defined in: [extensions/llm/tasks/llmChatSession.ts:50](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L50)

Configuration options for tool calling in an LLM chat session.

## Properties

### maxToolTurns?

> `readonly` `optional` **maxToolTurns**: `number`

Defined in: [extensions/llm/tasks/llmChatSession.ts:56](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L56)

Maximum consecutive tool execution turns to prevent runaway loops. Defaults to `5`.

---

### parseToolCalls

> `readonly` **parseToolCalls**: [`ToolParser`](../react-native-executorch/namespaces/llm/type-aliases/ToolParser.md)

Defined in: [extensions/llm/tasks/llmChatSession.ts:54](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L54)

Parser function to extract tool calls from generated output.

---

### tools

> `readonly` **tools**: readonly [`ToolDefinition`](../react-native-executorch/namespaces/llm/type-aliases/ToolDefinition.md)[]

Defined in: [extensions/llm/tasks/llmChatSession.ts:52](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L52)

Tool definitions available to the model.
