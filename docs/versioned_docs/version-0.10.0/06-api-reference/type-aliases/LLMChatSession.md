# Type Alias: LLMChatSession

> **LLMChatSession** = `object`

Defined in: [extensions/llm/tasks/llmChatSession.ts:100](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L100)

Handle to an active LLM chat session.

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [extensions/llm/tasks/llmChatSession.ts:109](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L109)

Disposes native model weights, KV cache, and tokenizer runtime resources.

#### Returns

`void`

---

### getHistory()

> **getHistory**(): readonly [`ChatMessage`](../react-native-executorch/namespaces/llm/type-aliases/ChatMessage.md)[]

Defined in: [extensions/llm/tasks/llmChatSession.ts:114](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L114)

Returns a snapshot of the current message history in the session.

#### Returns

readonly [`ChatMessage`](../react-native-executorch/namespaces/llm/type-aliases/ChatMessage.md)[]

---

### getKVCacheState()

> **getKVCacheState**(): [`LLMKVCacheState`](../react-native-executorch/namespaces/llm/type-aliases/LLMKVCacheState.md)

Defined in: [extensions/llm/tasks/llmChatSession.ts:119](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L119)

Returns current KV cache occupancy and total capacity statistics for the session runner.

#### Returns

[`LLMKVCacheState`](../react-native-executorch/namespaces/llm/type-aliases/LLMKVCacheState.md)

---

### sendMessage()

> **sendMessage**(`message`, `onToken?`, `genConfig?`): `Promise`\<[`LLMChatTurnResult`](LLMChatTurnResult.md)\>

Defined in: [extensions/llm/tasks/llmChatSession.ts:130](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L130)

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
malformed, or `INVALID_STATE` if the chat template is non-monotonic.

---

### stop()

> **stop**(): `void`

Defined in: [extensions/llm/tasks/llmChatSession.ts:104](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts#L104)

Interrupts and stops any active token generation call.

#### Returns

`void`
