# Interface: LLMType

Defined in: [types/llm.ts:33](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L33)

React hook for managing a Large Language Model (LLM) instance.

## Properties

### configure()

> **configure**: (`configuration`) => `void`

Defined in: [types/llm.ts:74](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L74)

Configures chat and tool calling.
See [Configuring the model](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useLLM#configuring-the-model) for details.

#### Parameters

##### configuration

[`LLMConfig`](LLMConfig.md)

Configuration object containing `chatConfig`, `toolsConfig`, and `generationConfig`.

#### Returns

`void`

---

### deleteMessage()

> **deleteMessage**: (`index`) => `void`

Defined in: [types/llm.ts:111](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L111)

Deletes all messages starting with message on `index` position. After deletion `messageHistory` will be updated.

#### Parameters

##### index

`number`

The index of the message to delete from history.

#### Returns

`void`

---

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/llm.ts:62](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L62)

Represents the download progress as a value between 0 and 1, indicating the extent of the model file retrieval.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/llm.ts:67](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L67)

Contains the error message if the model failed to load.

---

### generate()

> **generate**: (`messages`, `tools?`) => `Promise`\<`string`\>

Defined in: [types/llm.ts:87](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L87)

Runs model to complete chat passed in `messages` argument. It doesn't manage conversation context.

#### Parameters

##### messages

[`Message`](Message.md)[]

Array of messages representing the chat history.

##### tools?

`Object`[]

Optional array of tools that can be used during generation.

#### Returns

`Promise`\<`string`\>

The generated tokens as `string`.

---

### getGeneratedTokenCount()

> **getGeneratedTokenCount**: () => `number`

Defined in: [types/llm.ts:80](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L80)

Returns the number of tokens generated so far in the current generation.

#### Returns

`number`

The count of generated tokens.

---

### getPromptTokenCount()

> **getPromptTokenCount**: () => `number`

Defined in: [types/llm.ts:97](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L97)

Returns the number of prompt tokens in the last message.

#### Returns

`number`

The count of prompt token.

---

### getTotalTokenCount()

> **getTotalTokenCount**: () => `number`

Defined in: [types/llm.ts:92](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L92)

Returns the number of total tokens from the previous generation.This is a sum of prompt tokens and generated tokens.

#### Returns

`number`

The count of prompt and generated tokens.

---

### interrupt()

> **interrupt**: () => `void`

Defined in: [types/llm.ts:116](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L116)

Function to interrupt the current inference.

#### Returns

`void`

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/llm.ts:57](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L57)

Indicates whether the model is currently generating a response.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/llm.ts:52](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L52)

Indicates whether the model is ready.

---

### messageHistory

> **messageHistory**: [`Message`](Message.md)[]

Defined in: [types/llm.ts:37](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L37)

History containing all messages in conversation. This field is updated after model responds to sendMessage.

---

### response

> **response**: `string`

Defined in: [types/llm.ts:42](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L42)

State of the generated response. This field is updated with each token generated by the model.

---

### sendMessage()

> **sendMessage**: (`message`) => `Promise`\<`string`\>

Defined in: [types/llm.ts:105](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L105)

Function to add user message to conversation.
After model responds, `messageHistory` will be updated with both user message and model response.

#### Parameters

##### message

`string`

The message string to send.

#### Returns

`Promise`\<`string`\>

The model's response as a `string`.

---

### token

> **token**: `string`

Defined in: [types/llm.ts:47](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L47)

The most recently generated token.
