# Function: useLLMChatSession()

> **useLLMChatSession**(`config`, `options?`): `object`

Defined in: [hooks/useLLMChatSession.ts:26](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useLLMChatSession.ts#L26)

React hook to load and run an LLM chat session.

This hook manages downloading (if remote URLs are provided) and loading the
model assets and tokenizer files, tracking download progress and load errors,
and releasing native memory when the component unmounts or the configuration
changes.

For imperative usage, see [createLLMChatSession](createLLMChatSession.md).

## Parameters

### config

[`LLMModel`](../type-aliases/LLMModel.md)

The LLM model configuration. See [LLMModel](../type-aliases/LLMModel.md).

### options?

[`LLMChatSessionOptions`](../type-aliases/LLMChatSessionOptions.md) & [`ResourceOptions`](../type-aliases/ResourceOptions.md)

Chat session options and load/caching options.
See [LLMChatSessionOptions](../type-aliases/LLMChatSessionOptions.md) & [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [LLMChatSession](../type-aliases/LLMChatSession.md) (without `dispose`),
combined with loading state and download progress.

### downloadProgress

> **downloadProgress**: `number`

### error

> **error**: `Error` \| `undefined`

### getHistory

> **getHistory**: () => readonly [`ChatMessage`](../react-native-executorch/namespaces/llm/type-aliases/ChatMessage.md)[] \| `undefined` = `session.getHistory`

#### Type Declaration

() => readonly [`ChatMessage`](../react-native-executorch/namespaces/llm/type-aliases/ChatMessage.md)[]

Returns a snapshot of the current message history in the session.

#### Returns

readonly [`ChatMessage`](../react-native-executorch/namespaces/llm/type-aliases/ChatMessage.md)[]

`undefined`

### getKVCacheState

> **getKVCacheState**: () => [`LLMKVCacheState`](../react-native-executorch/namespaces/llm/type-aliases/LLMKVCacheState.md) \| `undefined` = `session.getKVCacheState`

#### Type Declaration

() => [`LLMKVCacheState`](../react-native-executorch/namespaces/llm/type-aliases/LLMKVCacheState.md)

Returns current KV cache occupancy and total capacity statistics for the session runner.

#### Returns

[`LLMKVCacheState`](../react-native-executorch/namespaces/llm/type-aliases/LLMKVCacheState.md)

`undefined`

### isReady

> **isReady**: `boolean` = `!!session`

### resource

> **resource**: [`LLMModel`](../type-aliases/LLMModel.md) \| `undefined`

### sendMessage

> **sendMessage**: (`message`, `onToken?`, `genConfig?`) => `Promise`\<[`LLMChatTurnResult`](../type-aliases/LLMChatTurnResult.md)\> \| `undefined` = `session.sendMessage`

#### Type Declaration

(`message`, `onToken?`, `genConfig?`) => `Promise`\<[`LLMChatTurnResult`](../type-aliases/LLMChatTurnResult.md)\>

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

`Promise`\<[`LLMChatTurnResult`](../type-aliases/LLMChatTurnResult.md)\>

A promise resolving to the generated messages and turn stats.

#### Throws

With code `INVALID_ARGUMENT` if the message is
malformed, or `INVALID_STATE` if the chat template is non-monotonic.

`undefined`

### stop

> **stop**: () => `void` \| `undefined` = `session.stop`

#### Type Declaration

() => `void`

Interrupts and stops any active token generation call.

#### Returns

`void`

`undefined`

## See

[LLMChatSession](../type-aliases/LLMChatSession.md)
