# Interface: LLMConfig

Defined in: [packages/react-native-executorch/src/types/llm.ts:133](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/llm.ts#L133)

Configuration object for initializing and customizing a Large Language Model (LLM) instance.

## Properties

### chatConfig?

> `optional` **chatConfig**: `Partial`\<[`ChatConfig`](ChatConfig.md)\>

Defined in: [packages/react-native-executorch/src/types/llm.ts:143](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/llm.ts#L143)

Object configuring chat management, contains following properties:

`systemPrompt` - Often used to tell the model what is its purpose, for example - "Be a helpful translator".

`initialMessageHistory` - An array of `Message` objects that represent the conversation history. This can be used to provide initial context to the model.

`contextWindowLength` - The number of messages from the current conversation that the model will use to generate a response. The higher the number, the more context the model will have. Keep in mind that using larger context windows will result in longer inference time and higher memory usage.

---

### generationConfig?

> `optional` **generationConfig**: [`GenerationConfig`](GenerationConfig.md)

Defined in: [packages/react-native-executorch/src/types/llm.ts:167](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/llm.ts#L167)

Object configuring generation settings.

`outputTokenBatchSize` - Soft upper limit on the number of tokens in each token batch (in certain cases there can be more tokens in given batch, i.e. when the batch would end with special emoji join character).

`batchTimeInterval` - Upper limit on the time interval between consecutive token batches.

`temperature` - Scales output logits by the inverse of temperature. Controls the randomness / creativity of text generation.

`topp` - Only samples from the smallest set of tokens whose cumulative probability exceeds topp.

---

### toolsConfig?

> `optional` **toolsConfig**: [`ToolsConfig`](ToolsConfig.md)

Defined in: [packages/react-native-executorch/src/types/llm.ts:154](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/llm.ts#L154)

Object configuring options for enabling and managing tool use. **It will only have effect if your model's chat template support it**. Contains following properties:

`tools` - List of objects defining tools.

`executeToolCallback` - Function that accepts `ToolCall`, executes tool and returns the string to model.

`displayToolCalls` - If set to true, JSON tool calls will be displayed in chat. If false, only answers will be displayed.
