# Interface: LLMTypeBase

Defined in: [types/llm.ts:98](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L98)

Base return type for `useLLM`. Contains all fields except `sendMessage`.

## Extended by

- [`LLMTypeMultimodal`](LLMTypeMultimodal.md)
- [`LLMType`](LLMType.md)

## Properties

### configure()

> **configure**: (`configuration`) => `void`

Defined in: [types/llm.ts:139](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L139)

Configures chat and tool calling.
See [Configuring the model](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useLLM#configuring-the-model) for details.

#### Parameters

##### configuration

[`LLMConfig`](LLMConfig.md)

Configuration object containing `chatConfig`, `toolsConfig`, and `generationConfig`.

#### Returns

`void`

***

### deleteMessage()

> **deleteMessage**: (`index`) => `void`

Defined in: [types/llm.ts:169](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L169)

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

Defined in: [types/llm.ts:127](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L127)

Represents the download progress as a value between 0 and 1, indicating the extent of the model file retrieval.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/llm.ts:132](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L132)

Contains the error message if the model failed to load.

***

### generate()

> **generate**: (`messages`, `tools?`) => `Promise`\<`string`\>

Defined in: [types/llm.ts:153](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L153)

Runs model to complete chat passed in `messages` argument. It doesn't manage conversation context.
For multimodal models, set `mediaPath` on user messages to include images.

#### Parameters

##### messages

[`Message`](Message.md)[]

Array of messages representing the chat history. User messages may include a `mediaPath` field with a local image path.

##### tools?

`Object`[]

Optional array of tools that can be used during generation.

#### Returns

`Promise`\<`string`\>

The generated tokens as `string`.

***

### getGeneratedTokenCount()

> **getGeneratedTokenCount**: () => `number`

Defined in: [types/llm.ts:145](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L145)

Returns the number of tokens generated so far in the current generation.

#### Returns

`number`

The count of generated tokens.

***

### getPromptTokenCount()

> **getPromptTokenCount**: () => `number`

Defined in: [types/llm.ts:163](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L163)

Returns the number of prompt tokens in the last message.

#### Returns

`number`

The count of prompt token.

***

### getTotalTokenCount()

> **getTotalTokenCount**: () => `number`

Defined in: [types/llm.ts:158](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L158)

Returns the number of total tokens from the previous generation. This is a sum of prompt tokens and generated tokens.

#### Returns

`number`

The count of prompt and generated tokens.

***

### interrupt()

> **interrupt**: () => `void`

Defined in: [types/llm.ts:174](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L174)

Function to interrupt the current inference.

#### Returns

`void`

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/llm.ts:122](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L122)

Indicates whether the model is currently generating a response.

***

### isReady

> **isReady**: `boolean`

Defined in: [types/llm.ts:117](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L117)

Indicates whether the model is ready.

***

### messageHistory

> **messageHistory**: [`Message`](Message.md)[]

Defined in: [types/llm.ts:102](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L102)

History containing all messages in conversation. This field is updated after model responds to sendMessage.

***

### response

> **response**: `string`

Defined in: [types/llm.ts:107](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L107)

State of the generated response. This field is updated with each token generated by the model.

***

### token

> **token**: `string`

Defined in: [types/llm.ts:112](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L112)

The most recently generated token.
