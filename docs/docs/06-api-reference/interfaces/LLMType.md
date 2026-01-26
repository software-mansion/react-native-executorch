# Interface: LLMType

Defined in: [packages/react-native-executorch/src/types/llm.ts:6](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/llm.ts#L6)

React hook for managing a Large Language Model (LLM) instance.

## Properties

### configure()

> **configure**: (`configuration`) => `void`

Defined in: [packages/react-native-executorch/src/types/llm.ts:48](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/llm.ts#L48)

Configures chat and tool calling.
See [Configuring the model](../../03-hooks/01-natural-language-processing/useLLM.md#configuring-the-model) for details.

#### Parameters

##### configuration

Configuration object containing `chatConfig`, `toolsConfig`, and `generationConfig`.

###### chatConfig?

`Partial`\<[`ChatConfig`](ChatConfig.md)\>

Object configuring chat management, contains following properties:

`systemPrompt` - Often used to tell the model what is its purpose, for example - "Be a helpful translator".

`initialMessageHistory` - An array of `Message` objects that represent the conversation history. This can be used to provide initial context to the model.

`contextWindowLength` - The number of messages from the current conversation that the model will use to generate a response. The higher the number, the more context the model will have. Keep in mind that using larger context windows will result in longer inference time and higher memory usage.

###### generationConfig?

[`GenerationConfig`](GenerationConfig.md)

Object configuring generation settings.

`outputTokenBatchSize` - Soft upper limit on the number of tokens in each token batch (in certain cases there can be more tokens in given batch, i.e. when the batch would end with special emoji join character).

`batchTimeInterval` - Upper limit on the time interval between consecutive token batches.

`temperature` - Scales output logits by the inverse of temperature. Controls the randomness / creativity of text generation.

`topp` - Only samples from the smallest set of tokens whose cumulative probability exceeds topp.

###### toolsConfig?

[`ToolsConfig`](ToolsConfig.md)

Object configuring options for enabling and managing tool use. **It will only have effect if your model's chat template support it**. Contains following properties:

`tools` - List of objects defining tools.

`executeToolCallback` - Function that accepts `ToolCall`, executes tool and returns the string to model.

`displayToolCalls` - If set to true, JSON tool calls will be displayed in chat. If false, only answers will be displayed.

#### Returns

`void`

***

### deleteMessage()

> **deleteMessage**: (`index`) => `void`

Defined in: [packages/react-native-executorch/src/types/llm.ts:114](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/llm.ts#L114)

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

Defined in: [packages/react-native-executorch/src/types/llm.ts:35](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/llm.ts#L35)

Represents the download progress as a value between 0 and 1, indicating the extent of the model file retrieval.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/llm.ts:40](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/llm.ts#L40)

Contains the error message if the model failed to load.

***

### generate()

> **generate**: (`messages`, `tools?`) => `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/llm.ts:100](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/llm.ts#L100)

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

Defined in: [packages/react-native-executorch/src/types/llm.ts:93](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/llm.ts#L93)

Returns the number of tokens generated so far in the current generation.

#### Returns

`number`

The count of generated tokens.

***

### interrupt()

> **interrupt**: () => `void`

Defined in: [packages/react-native-executorch/src/types/llm.ts:119](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/llm.ts#L119)

Function to interrupt the current inference.

#### Returns

`void`

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/llm.ts:30](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/llm.ts#L30)

Indicates whether the model is currently generating a response.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/llm.ts:25](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/llm.ts#L25)

Indicates whether the model is ready.

***

### messageHistory

> **messageHistory**: [`Message`](Message.md)[]

Defined in: [packages/react-native-executorch/src/types/llm.ts:10](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/llm.ts#L10)

History containing all messages in conversation. This field is updated after model responds to sendMessage.

***

### response

> **response**: `string`

Defined in: [packages/react-native-executorch/src/types/llm.ts:15](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/llm.ts#L15)

State of the generated response. This field is updated with each token generated by the model.

***

### sendMessage()

> **sendMessage**: (`message`) => `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/llm.ts:107](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/llm.ts#L107)

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

Defined in: [packages/react-native-executorch/src/types/llm.ts:20](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/llm.ts#L20)

The most recently generated token.
