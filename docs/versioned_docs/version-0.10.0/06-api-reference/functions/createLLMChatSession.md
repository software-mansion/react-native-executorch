# Function: createLLMChatSession()

> **createLLMChatSession**(`config`, `options?`, `runtime?`): `Promise`\<[`LLMChatSession`](../type-aliases/LLMChatSession.md)\>

Defined in: [extensions/llm/tasks/llmChatSession.ts:175](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L175)

Instantiates an LLM chat session using background thread execution.

## Parameters

### config

[`LLMModel`](../type-aliases/LLMModel.md)

Model configuration containing model, tokenizer, and tokenizer config paths.

### options?

[`LLMChatSessionOptions`](../type-aliases/LLMChatSessionOptions.md) = `{}`

Custom generation, tool calling, and state options.

### runtime?

`WorkletRuntime`

The worklet runtime thread to run native generation on.

## Returns

`Promise`\<[`LLMChatSession`](../type-aliases/LLMChatSession.md)\>

A promise resolving to the instantiated [LLMChatSession](../type-aliases/LLMChatSession.md) session.
