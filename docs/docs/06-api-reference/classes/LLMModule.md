# Class: LLMModule

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:14](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L14)

Module for managing a Large Language Model (LLM) instance.

## Constructors

### Constructor

> **new LLMModule**(`optionalCallbacks`): `LLMModule`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:23](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L23)

Creates a new instance of LLMModule with optional callbacks.

#### Parameters

##### optionalCallbacks

Object containing optional callbacks.

###### messageHistoryCallback?

(`messageHistory`) => `void`

Optional callback invoked on message history updates (`Message[]`).

###### responseCallback?

(`response`) => `void`

Optional callback invoked on every response update (`string`).

###### tokenCallback?

(`token`) => `void`

Optional callback invoked on every token batch (`string`).

#### Returns

`LLMModule`

A new LLMModule instance.

## Methods

### configure()

> **configure**(`configuration`): `void`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:90](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L90)

Configures chat and tool calling and generation settings.
See [Configuring the model](../../03-hooks/01-natural-language-processing/useLLM.md#configuring-the-model) for details.

#### Parameters

##### configuration

[`LLMConfig`](../interfaces/LLMConfig.md)

Configuration object containing `chatConfig`, `toolsConfig`, and `generationConfig`.

#### Returns

`void`

***

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:171](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L171)

Method to delete the model from memory. 
Note you cannot delete model while it's generating. 
You need to interrupt it first and make sure model stopped generation.

#### Returns

`void`

***

### deleteMessage()

> **deleteMessage**(`index`): [`Message`](../interfaces/Message.md)[]

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:145](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L145)

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

***

### forward()

> **forward**(`input`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:107](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L107)

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

***

### generate()

> **generate**(`messages`, `tools?`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:119](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L119)

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

***

### getGeneratedTokenCount()

> **getGeneratedTokenCount**(): `number`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:162](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L162)

Returns the number of tokens generated in the last response.

#### Returns

`number`

The count of generated tokens.

***

### interrupt()

> **interrupt**(): `void`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:153](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L153)

Interrupts model generation. It may return one more token after interrupt.

#### Returns

`void`

***

### load()

> **load**(`model`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:57](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L57)

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

***

### sendMessage()

> **sendMessage**(`message`): `Promise`\<[`Message`](../interfaces/Message.md)[]\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:132](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L132)

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

***

### setTokenCallback()

> **setTokenCallback**(`tokenCallback`): `void`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:76](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L76)

Sets new token callback invoked on every token batch.

#### Parameters

##### tokenCallback

Callback function to handle new tokens.

###### tokenCallback

(`token`) => `void`

#### Returns

`void`
