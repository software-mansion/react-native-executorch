# Interface: LLMType

Defined in: [packages/react-native-executorch/src/types/llm.ts:8](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L8)

React hook for managing a Large Language Model (LLM) instance.

## Properties

### configure()

> **configure**: (`configuration`) => `void`

Defined in: [packages/react-native-executorch/src/types/llm.ts:50](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L50)

Configures chat and tool calling.
See [Configuring the model](../../03-hooks/01-natural-language-processing/useLLM.md#configuring-the-model) for details.

#### Parameters

##### configuration

[`LLMConfig`](LLMConfig.md)

Configuration object containing `chatConfig`, `toolsConfig`, and `generationConfig`.

#### Returns

`void`

***

### deleteMessage()

> **deleteMessage**: (`index`) => `void`

Defined in: [packages/react-native-executorch/src/types/llm.ts:84](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L84)

Deletes all messages starting with message on `index` position. After deletion `messageHistory` will be updated.

#### Parameters

##### index

`number`

The index of the message to delete from history.

#### Returns

`void`

***

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:37](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L37)

Represents the download progress as a value between 0 and 1, indicating the extent of the model file retrieval.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/llm.ts:42](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L42)

Contains the error message if the model failed to load.

***

### generate()

> **generate**: (`messages`, `tools?`) => `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/llm.ts:69](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L69)

Runs model to complete chat passed in `messages` argument. It doesn't manage conversation context.

#### Parameters

##### messages

[`Message`](Message.md)[]

Array of messages representing the chat history.

##### tools?

`Object`[]

Optional array of tools that can be used during generation.

#### Returns

`Promise`\<`void`\>

***

### getGeneratedTokenCount()

> **getGeneratedTokenCount**: () => `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:61](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L61)

Returns the number of tokens generated so far in the current generation.

#### Returns

`number`

The count of generated tokens.

***

### interrupt()

> **interrupt**: () => `void`

Defined in: [packages/react-native-executorch/src/types/llm.ts:89](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L89)

Function to interrupt the current inference.

#### Returns

`void`

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/llm.ts:32](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L32)

Indicates whether the model is currently generating a response.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/llm.ts:27](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L27)

Indicates whether the model is ready.

***

### messageHistory

> **messageHistory**: [`Message`](Message.md)[]

Defined in: [packages/react-native-executorch/src/types/llm.ts:12](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L12)

History containing all messages in conversation. This field is updated after model responds to sendMessage.

***

### response

> **response**: `string`

Defined in: [packages/react-native-executorch/src/types/llm.ts:17](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L17)

State of the generated response. This field is updated with each token generated by the model.

***

### sendMessage()

> **sendMessage**: (`message`) => `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/llm.ts:77](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L77)

Function to add user message to conversation.
After model responds, `messageHistory` will be updated with both user message and model response.

#### Parameters

##### message

`string`

The message string to send.

#### Returns

`Promise`\<`void`\>

***

### token

> **token**: `string`

Defined in: [packages/react-native-executorch/src/types/llm.ts:22](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L22)

The most recently generated token.
