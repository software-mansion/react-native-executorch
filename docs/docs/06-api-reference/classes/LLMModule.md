# Class: LLMModule

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts:10](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L10)

Module for managing a Large Language Model (LLM) instance.

## Constructors

### Constructor

> **new LLMModule**(`optionalCallbacks`): `LLMModule`

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts:19](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L19)

Creates a new instance of `LLMModule` with optional callbacks.

#### Parameters

##### optionalCallbacks

Object containing optional callbacks.

###### messageHistoryCallback?

(`messageHistory`) => `void`

An optional function called on every finished message (`Message[]`).
Returns the entire message history.

###### responseCallback?

(`response`) => `void`

An optional function that will be called on every generated token and receives the entire response (`string`), including this token.
[DEPRECATED - consider using tokenCallback]

###### tokenCallback?

(`token`) => `void`

An optional function that will be called on every generated token (`string`) with that token as its only argument.

#### Returns

`LLMModule`

A new LLMModule instance.

## Methods

### configure()

> **configure**(`configuration`): `void`

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts:86](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L86)

Configures chat and tool calling and generation settings.
See [Configuring the model](../../03-hooks/01-natural-language-processing/useLLM.md#configuring-the-model) for details.

#### Parameters

##### configuration

[`LLMConfig`](../interfaces/LLMConfig.md)

Configuration object containing `chatConfig`, `toolsConfig`, and `generationConfig`.

#### Returns

`void`

---

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts:161](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L161)

Method to delete the model from memory.
Note you cannot delete model while it's generating.
You need to interrupt it first and make sure model stopped generation.

#### Returns

`void`

---

### deleteMessage()

> **deleteMessage**(`index`): [`Message`](../interfaces/Message.md)[]

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts:135](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L135)

Deletes all messages starting with message on `index` position.
After deletion it will call `messageHistoryCallback()` containing new history.
It also returns it.

#### Parameters

##### index

`number`

The index of the message to delete from history.

#### Returns

[`Message`](../interfaces/Message.md)[]

- Updated message history after deletion.

---

### forward()

> **forward**(`input`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts:99](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L99)

Runs model inference with raw input string.
You need to provide entire conversation and prompt (in correct format and with special tokens!) in input string to this method.
It doesn't manage conversation context. It is intended for users that need access to the model itself without any wrapper.
If you want a simple chat with model the consider using `sendMessage`

#### Parameters

##### input

`string`

Raw input string containing the prompt and conversation history.

#### Returns

`Promise`\<`string`\>

The generated response as a string.

---

### generate()

> **generate**(`messages`, `tools?`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts:110](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L110)

Runs model to complete chat passed in `messages` argument. It doesn't manage conversation context.

#### Parameters

##### messages

[`Message`](../interfaces/Message.md)[]

Array of messages representing the chat history.

##### tools?

`Object`[]

Optional array of tools that can be used during generation.

#### Returns

`Promise`\<`string`\>

The generated response as a string.

---

### getGeneratedTokenCount()

> **getGeneratedTokenCount**(): `number`

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts:152](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L152)

Returns the number of tokens generated in the last response.

#### Returns

`number`

The count of generated tokens.

---

### interrupt()

> **interrupt**(): `void`

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts:143](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L143)

Interrupts model generation. It may return one more token after interrupt.

#### Returns

`void`

---

### load()

> **load**(`model`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts:53](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L53)

Loads the LLM model and tokenizer.

#### Parameters

##### model

Object containing model, tokenizer, and tokenizer config sources.

###### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` that specifies the location of the model binary.

###### tokenizerConfigSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` pointing to the JSON file which contains the tokenizer config.

###### tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` pointing to the JSON file which contains the tokenizer.

##### onDownloadProgressCallback

(`progress`) => `void`

Optional callback to track download progress (value between 0 and 1).

#### Returns

`Promise`\<`void`\>

---

### sendMessage()

> **sendMessage**(`message`): `Promise`\<[`Message`](../interfaces/Message.md)[]\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts:122](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L122)

Method to add user message to conversation.
After model responds it will call `messageHistoryCallback()` containing both user message and model response.
It also returns them.

#### Parameters

##### message

`string`

The message string to send.

#### Returns

`Promise`\<[`Message`](../interfaces/Message.md)[]\>

- Updated message history including the new user message and model response.

---

### setTokenCallback()

> **setTokenCallback**(`tokenCallback`): `void`

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts:72](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L72)

Sets new token callback invoked on every token batch.

#### Parameters

##### tokenCallback

Callback function to handle new tokens.

###### tokenCallback

(`token`) => `void`

#### Returns

`void`
