# Function: createLLMChatSession()

> **createLLMChatSession**(`config`, `options?`, `runtime?`): `Promise`\<[`LLMChatSession`](../type-aliases/LLMChatSession.md)\>

Defined in: [extensions/llm/tasks/llmChatSession.ts:178](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L178)

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
