# Interface: LLMType

Defined in: [packages/react-native-executorch/src/types/llm.ts:6](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/llm.ts#L6)

React hook for managing a Large Language Model (LLM) instance.

## Properties

### configure()

> **configure**: (`configuration`) => `void`

Defined in: [packages/react-native-executorch/src/types/llm.ts:48](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/llm.ts#L48)

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

Defined in: [packages/react-native-executorch/src/types/llm.ts:82](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/llm.ts#L82)

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

Defined in: [packages/react-native-executorch/src/types/llm.ts:35](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/llm.ts#L35)

Represents the download progress as a value between 0 and 1, indicating the extent of the model file retrieval.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/llm.ts:40](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/llm.ts#L40)

Contains the error message if the model failed to load.

***

### generate()

> **generate**: (`messages`, `tools?`) => `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/llm.ts:67](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/llm.ts#L67)

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

Defined in: [packages/react-native-executorch/src/types/llm.ts:59](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/llm.ts#L59)

Returns the number of tokens generated so far in the current generation.

#### Returns

`number`

The count of generated tokens.

***

### interrupt()

> **interrupt**: () => `void`

Defined in: [packages/react-native-executorch/src/types/llm.ts:87](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/llm.ts#L87)

Function to interrupt the current inference.

#### Returns

`void`

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/llm.ts:30](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/llm.ts#L30)

Indicates whether the model is currently generating a response.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/llm.ts:25](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/llm.ts#L25)

Indicates whether the model is ready.

***

### messageHistory

> **messageHistory**: [`Message`](Message.md)[]

Defined in: [packages/react-native-executorch/src/types/llm.ts:10](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/llm.ts#L10)

History containing all messages in conversation. This field is updated after model responds to sendMessage.

***

### response

> **response**: `string`

Defined in: [packages/react-native-executorch/src/types/llm.ts:15](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/llm.ts#L15)

State of the generated response. This field is updated with each token generated by the model.

***

### sendMessage()

> **sendMessage**: (`message`) => `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/llm.ts:75](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/llm.ts#L75)

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

Defined in: [packages/react-native-executorch/src/types/llm.ts:20](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/llm.ts#L20)

The most recently generated token.
