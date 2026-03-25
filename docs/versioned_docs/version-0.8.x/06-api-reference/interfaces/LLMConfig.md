# Interface: LLMConfig

Defined in: [types/llm.ts:215](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L215)

Configuration object for initializing and customizing a Large Language Model (LLM) instance.

## Properties

### chatConfig?

> `optional` **chatConfig**: `Partial`\<[`ChatConfig`](ChatConfig.md)\>

Defined in: [types/llm.ts:225](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L225)

Object configuring chat management, contains following properties:

`systemPrompt` - Often used to tell the model what is its purpose, for example - "Be a helpful translator".

`initialMessageHistory` - An array of `Message` objects that represent the conversation history. This can be used to provide initial context to the model.

`contextStrategy` - Defines a strategy for managing the conversation context window and message history

***

### generationConfig?

> `optional` **generationConfig**: [`GenerationConfig`](GenerationConfig.md)

Defined in: [types/llm.ts:249](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L249)

Object configuring generation settings.

`outputTokenBatchSize` - Soft upper limit on the number of tokens in each token batch (in certain cases there can be more tokens in given batch, i.e. when the batch would end with special emoji join character).

`batchTimeInterval` - Upper limit on the time interval between consecutive token batches.

`temperature` - Scales output logits by the inverse of temperature. Controls the randomness / creativity of text generation.

`topp` - Only samples from the smallest set of tokens whose cumulative probability exceeds topp.

***

### toolsConfig?

> `optional` **toolsConfig**: [`ToolsConfig`](ToolsConfig.md)

Defined in: [types/llm.ts:236](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L236)

Object configuring options for enabling and managing tool use. **It will only have effect if your model's chat template support it**. Contains following properties:

`tools` - List of objects defining tools.

`executeToolCallback` - Function that accepts `ToolCall`, executes tool and returns the string to model.

`displayToolCalls` - If set to true, JSON tool calls will be displayed in chat. If false, only answers will be displayed.
