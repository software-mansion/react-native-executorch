# Class: LLMModule

Defined in: [modules/natural\_language\_processing/LLMModule.ts:17](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L17)

Module for managing a Large Language Model (LLM) instance.

## Methods

### configure()

> **configure**(`config`): `void`

Defined in: [modules/natural\_language\_processing/LLMModule.ts:132](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L132)

Configures chat and tool calling and generation settings.
See [Configuring the model](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useLLM#configuring-the-model) for details.

#### Parameters

##### config

[`LLMConfig`](../interfaces/LLMConfig.md)

Configuration object containing `chatConfig`, `toolsConfig`, and `generationConfig`.

#### Returns

`void`

***

### delete()

> **delete**(): `void`

Defined in: [modules/natural\_language\_processing/LLMModule.ts:224](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L224)

Method to delete the model from memory.
Note you cannot delete model while it's generating.
You need to interrupt it first and make sure model stopped generation.

#### Returns

`void`

***

### deleteMessage()

> **deleteMessage**(`index`): [`Message`](../interfaces/Message.md)[]

Defined in: [modules/natural\_language\_processing/LLMModule.ts:183](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L183)

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

> **forward**(`input`, `imagePaths?`): `Promise`\<`string`\>

Defined in: [modules/natural\_language\_processing/LLMModule.ts:145](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L145)

Runs model inference with raw input string.
You need to provide entire conversation and prompt (in correct format and with special tokens!) in input string to this method.
It doesn't manage conversation context. It is intended for users that need access to the model itself without any wrapper.
If you want a simple chat with model the consider using `sendMessage`

#### Parameters

##### input

`string`

Raw input string containing the prompt and conversation history.

##### imagePaths?

`string`[]

Optional array of local image paths for multimodal inference.

#### Returns

`Promise`\<`string`\>

The generated response as a string.

***

### generate()

> **generate**(`messages`, `tools?`): `Promise`\<`string`\>

Defined in: [modules/natural\_language\_processing/LLMModule.ts:156](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L156)

Runs model to complete chat passed in `messages` argument. It doesn't manage conversation context.
For multimodal models, set `mediaPath` on user messages to include images.

#### Parameters

##### messages

[`Message`](../interfaces/Message.md)[]

Array of messages representing the chat history. User messages may include a `mediaPath` field with a local image path.

##### tools?

`Object`[]

Optional array of tools that can be used during generation.

#### Returns

`Promise`\<`string`\>

The generated response as a string.

***

### getGeneratedTokenCount()

> **getGeneratedTokenCount**(): `number`

Defined in: [modules/natural\_language\_processing/LLMModule.ts:199](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L199)

Returns the number of tokens generated in the last response.

#### Returns

`number`

The count of generated tokens.

***

### getPromptTokensCount()

> **getPromptTokensCount**(): `number`

Defined in: [modules/natural\_language\_processing/LLMModule.ts:207](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L207)

Returns the number of prompt tokens in the last message.

#### Returns

`number`

The count of prompt token.

***

### getTotalTokensCount()

> **getTotalTokensCount**(): `number`

Defined in: [modules/natural\_language\_processing/LLMModule.ts:215](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L215)

Returns the number of total tokens from the previous generation. This is a sum of prompt tokens and generated tokens.

#### Returns

`number`

The count of prompt and generated tokens.

***

### interrupt()

> **interrupt**(): `void`

Defined in: [modules/natural\_language\_processing/LLMModule.ts:191](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L191)

Interrupts model generation. It may return one more token after interrupt.

#### Returns

`void`

***

### sendMessage()

> **sendMessage**(`message`, `media?`): `Promise`\<[`Message`](../interfaces/Message.md)[]\>

Defined in: [modules/natural\_language\_processing/LLMModule.ts:168](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L168)

Method to add user message to conversation.
After model responds it will call `messageHistoryCallback()` containing both user message and model response.
It also returns them.

#### Parameters

##### message

`string`

The message string to send.

##### media?

Optional media object containing a local image path for multimodal models.

###### imagePath?

`string`

#### Returns

`Promise`\<[`Message`](../interfaces/Message.md)[]\>

- Updated message history including the new user message and model response.

***

### setTokenCallback()

> **setTokenCallback**(`tokenCallback`): `void`

Defined in: [modules/natural\_language\_processing/LLMModule.ts:119](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L119)

Sets new token callback invoked on every token batch.

#### Parameters

##### tokenCallback

Callback function to handle new tokens.

###### tokenCallback

(`token`) => `void`

#### Returns

`void`

***

### fromCustomModel()

> `static` **fromCustomModel**(`modelSource`, `tokenizerSource`, `tokenizerConfigSource`, `onDownloadProgress?`, `tokenCallback?`, `messageHistoryCallback?`): `Promise`\<`LLMModule`\>

Defined in: [modules/natural\_language\_processing/LLMModule.ts:94](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L94)

Creates an LLM instance with a user-provided model binary.
Use this when working with a custom-exported LLM.
Internally uses `'custom'` as the model name for telemetry.

## Required model contract

The `.pte` model binary must be exported following the
[ExecuTorch LLM export process](https://docs.pytorch.org/executorch/1.1/llm/export-llm.html).
The native runner expects the standard ExecuTorch text-generation interface — KV-cache
management, prefill/decode phases, and logit sampling are all handled by the runtime.

#### Parameters

##### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the model binary.

##### tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the tokenizer JSON file.

##### tokenizerConfigSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the tokenizer config JSON file.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

##### tokenCallback?

(`token`) => `void`

Optional callback invoked on every generated token.

##### messageHistoryCallback?

(`messageHistory`) => `void`

Optional callback invoked when the model finishes a response, with the full message history.

#### Returns

`Promise`\<`LLMModule`\>

A Promise resolving to an `LLMModule` instance.

***

### fromModelName()

> `static` **fromModelName**(`namedSources`, `onDownloadProgress?`, `tokenCallback?`, `messageHistoryCallback?`): `Promise`\<`LLMModule`\>

Defined in: [modules/natural\_language\_processing/LLMModule.ts:47](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L47)

Creates an LLM instance for a built-in model.

#### Parameters

##### namedSources

An object specifying the model name, model source, tokenizer source,
  tokenizer config source, and optional capabilities.

###### capabilities?

readonly `"vision"`[]

###### modelName

[`LLMModelName`](../type-aliases/LLMModelName.md)

###### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

###### tokenizerConfigSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

###### tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

##### tokenCallback?

(`token`) => `void`

Optional callback invoked on every generated token.

##### messageHistoryCallback?

(`messageHistory`) => `void`

Optional callback invoked when the model finishes a response, with the full message history.

#### Returns

`Promise`\<`LLMModule`\>

A Promise resolving to an `LLMModule` instance.

#### Example

```ts
import { LLMModule, LLAMA3_2_3B } from 'react-native-executorch';
const llm = await LLMModule.fromModelName(LLAMA3_2_3B);
```
