# Interface: LLMTypeBase

Defined in: [types/llm.ts:112](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L112)

Base return type for `useLLM`. Contains all fields except `sendMessage`.

## Extended by

- [`LLMTypeMultimodal`](LLMTypeMultimodal.md)
- [`LLMType`](LLMType.md)

## Properties

### configure()

> **configure**: (`configuration`) => `void`

Defined in: [types/llm.ts:153](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L153)

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

Defined in: [types/llm.ts:183](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L183)

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

Defined in: [types/llm.ts:141](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L141)

Represents the download progress as a value between 0 and 1, indicating the extent of the model file retrieval.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/llm.ts:146](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L146)

Contains the error message if the model failed to load.

---

### generate()

> **generate**: (`messages`, `tools?`) => `Promise`\<`string`\>

Defined in: [types/llm.ts:167](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L167)

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

---

### getGeneratedTokenCount()

> **getGeneratedTokenCount**: () => `number`

Defined in: [types/llm.ts:159](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L159)

Returns the number of tokens generated so far in the current generation.

#### Returns

`number`

The count of generated tokens.

---

### getPromptTokenCount()

> **getPromptTokenCount**: () => `number`

Defined in: [types/llm.ts:177](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L177)

Returns the number of prompt tokens in the last message.

#### Returns

`number`

The count of prompt token.

---

### getTotalTokenCount()

> **getTotalTokenCount**: () => `number`

Defined in: [types/llm.ts:172](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L172)

Returns the number of total tokens from the previous generation. This is a sum of prompt tokens and generated tokens.

#### Returns

`number`

The count of prompt and generated tokens.

---

### interrupt()

> **interrupt**: () => `void`

Defined in: [types/llm.ts:188](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L188)

Function to interrupt the current inference.

#### Returns

`void`

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/llm.ts:136](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L136)

Indicates whether the model is currently generating a response.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/llm.ts:131](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L131)

Indicates whether the model is ready.

---

### messageHistory

> **messageHistory**: [`Message`](Message.md)[]

Defined in: [types/llm.ts:116](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L116)

History containing all messages in conversation. This field is updated after model responds to sendMessage.

---

### response

> **response**: `string`

Defined in: [types/llm.ts:121](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L121)

State of the generated response. This field is updated with each token generated by the model.

---

### token

> **token**: `string`

Defined in: [types/llm.ts:126](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L126)

The most recently generated token.
