# Type Alias: LLMChatSession

> **LLMChatSession** = `object`

Defined in: [extensions/llm/tasks/llmChatSession.ts:102](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L102)

Handle to an active LLM chat session.

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [extensions/llm/tasks/llmChatSession.ts:111](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L111)

Disposes native model weights, KV cache, and tokenizer runtime resources.

#### Returns

`void`

---

### getHistory()

> **getHistory**(): readonly [`ChatMessage`](../react-native-executorch/namespaces/llm/type-aliases/ChatMessage.md)[]

Defined in: [extensions/llm/tasks/llmChatSession.ts:116](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L116)

Returns a snapshot of the current message history in the session.

#### Returns

readonly [`ChatMessage`](../react-native-executorch/namespaces/llm/type-aliases/ChatMessage.md)[]

---

### getKVCacheState()

> **getKVCacheState**(): [`LLMKVCacheState`](../react-native-executorch/namespaces/llm/type-aliases/LLMKVCacheState.md)

Defined in: [extensions/llm/tasks/llmChatSession.ts:121](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L121)

Returns current KV cache occupancy and total capacity statistics for the session runner.

#### Returns

[`LLMKVCacheState`](../react-native-executorch/namespaces/llm/type-aliases/LLMKVCacheState.md)

---

### sendMessage()

> **sendMessage**(`message`, `onToken?`, `genConfig?`): `Promise`\<[`LLMChatTurnResult`](LLMChatTurnResult.md)\>

Defined in: [extensions/llm/tasks/llmChatSession.ts:133](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L133)

Sends a user message or chat turn to the model and generates a response.

#### Parameters

##### message

[`ChatMessageContent`](../react-native-executorch/namespaces/llm/type-aliases/ChatMessageContent.md)

Message string or interleaved media payload array.

##### onToken?

(`token`) => `void`

Callback fired on the RN thread for each decoded token.

##### genConfig?

[`LLMGenerationConfig`](../react-native-executorch/namespaces/llm/type-aliases/LLMGenerationConfig.md)

Generation options overriding session defaults.

#### Returns

`Promise`\<[`LLMChatTurnResult`](LLMChatTurnResult.md)\>

A promise resolving to the generated messages and turn stats.

#### Throws

With code `INVALID_ARGUMENT` if the message is
malformed, `INVALID_STATE` if the chat template is non-monotonic, or
`RESOURCE_BUSY` if another turn is in progress.

---

### stop()

> **stop**(): `void`

Defined in: [extensions/llm/tasks/llmChatSession.ts:106](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L106)

Stops active generation and discards the current turn after its tool calls finish.

#### Returns

`void`
