# Interface: LLMType

Defined in: [types/llm.ts:201](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L201)

Return type for `useLLM` when `model.capabilities` is absent or does not include `'vision'`.
`sendMessage` accepts only text.

## Extends

- [`LLMTypeBase`](LLMTypeBase.md)

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

#### Inherited from

[`LLMTypeBase`](LLMTypeBase.md).[`configure`](LLMTypeBase.md#configure)

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

#### Inherited from

[`LLMTypeBase`](LLMTypeBase.md).[`deleteMessage`](LLMTypeBase.md#deletemessage)

***

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/llm.ts:127](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L127)

Represents the download progress as a value between 0 and 1, indicating the extent of the model file retrieval.

#### Inherited from

[`LLMTypeBase`](LLMTypeBase.md).[`downloadProgress`](LLMTypeBase.md#downloadprogress)

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/llm.ts:132](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L132)

Contains the error message if the model failed to load.

#### Inherited from

[`LLMTypeBase`](LLMTypeBase.md).[`error`](LLMTypeBase.md#error)

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

#### Inherited from

[`LLMTypeBase`](LLMTypeBase.md).[`generate`](LLMTypeBase.md#generate)

***

### getGeneratedTokenCount()

> **getGeneratedTokenCount**: () => `number`

Defined in: [types/llm.ts:145](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L145)

Returns the number of tokens generated so far in the current generation.

#### Returns

`number`

The count of generated tokens.

#### Inherited from

[`LLMTypeBase`](LLMTypeBase.md).[`getGeneratedTokenCount`](LLMTypeBase.md#getgeneratedtokencount)

***

### getPromptTokenCount()

> **getPromptTokenCount**: () => `number`

Defined in: [types/llm.ts:163](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L163)

Returns the number of prompt tokens in the last message.

#### Returns

`number`

The count of prompt token.

#### Inherited from

[`LLMTypeBase`](LLMTypeBase.md).[`getPromptTokenCount`](LLMTypeBase.md#getprompttokencount)

***

### getTotalTokenCount()

> **getTotalTokenCount**: () => `number`

Defined in: [types/llm.ts:158](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L158)

Returns the number of total tokens from the previous generation. This is a sum of prompt tokens and generated tokens.

#### Returns

`number`

The count of prompt and generated tokens.

#### Inherited from

[`LLMTypeBase`](LLMTypeBase.md).[`getTotalTokenCount`](LLMTypeBase.md#gettotaltokencount)

***

### interrupt()

> **interrupt**: () => `void`

Defined in: [types/llm.ts:174](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L174)

Function to interrupt the current inference.

#### Returns

`void`

#### Inherited from

[`LLMTypeBase`](LLMTypeBase.md).[`interrupt`](LLMTypeBase.md#interrupt)

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/llm.ts:122](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L122)

Indicates whether the model is currently generating a response.

#### Inherited from

[`LLMTypeBase`](LLMTypeBase.md).[`isGenerating`](LLMTypeBase.md#isgenerating)

***

### isReady

> **isReady**: `boolean`

Defined in: [types/llm.ts:117](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L117)

Indicates whether the model is ready.

#### Inherited from

[`LLMTypeBase`](LLMTypeBase.md).[`isReady`](LLMTypeBase.md#isready)

***

### messageHistory

> **messageHistory**: [`Message`](Message.md)[]

Defined in: [types/llm.ts:102](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L102)

History containing all messages in conversation. This field is updated after model responds to sendMessage.

#### Inherited from

[`LLMTypeBase`](LLMTypeBase.md).[`messageHistory`](LLMTypeBase.md#messagehistory)

***

### response

> **response**: `string`

Defined in: [types/llm.ts:107](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L107)

State of the generated response. This field is updated with each token generated by the model.

#### Inherited from

[`LLMTypeBase`](LLMTypeBase.md).[`response`](LLMTypeBase.md#response)

***

### sendMessage()

> **sendMessage**: (`message`) => `Promise`\<`string`\>

Defined in: [types/llm.ts:208](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L208)

Function to add user message to conversation.
After model responds, `messageHistory` will be updated.

#### Parameters

##### message

`string`

The message string to send.

#### Returns

`Promise`\<`string`\>

The model's response as a `string`.

***

### token

> **token**: `string`

Defined in: [types/llm.ts:112](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L112)

The most recently generated token.

#### Inherited from

[`LLMTypeBase`](LLMTypeBase.md).[`token`](LLMTypeBase.md#token)
