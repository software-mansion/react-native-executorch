# Interface: LLMConfig

Defined in: [types/llm.ts:229](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L229)

Configuration object for initializing and customizing a Large Language Model (LLM) instance.

## Properties

### chatConfig?

> `optional` **chatConfig**: `Partial`\<[`ChatConfig`](ChatConfig.md)\>

Defined in: [types/llm.ts:239](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L239)

Object configuring chat management, contains following properties:

`systemPrompt` - Often used to tell the model what is its purpose, for example - "Be a helpful translator".

`initialMessageHistory` - An array of `Message` objects that represent the conversation history. This can be used to provide initial context to the model.

`contextStrategy` - Defines a strategy for managing the conversation context window and message history

---

### generationConfig?

> `optional` **generationConfig**: [`GenerationConfig`](GenerationConfig.md)

Defined in: [types/llm.ts:267](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L267)

Object configuring generation settings.

`outputTokenBatchSize` - Soft upper limit on the number of tokens in each token batch (in certain cases there can be more tokens in given batch, i.e. when the batch would end with special emoji join character).

`batchTimeInterval` - Upper limit on the time interval between consecutive token batches.

`temperature` - Scales output logits by the inverse of temperature. Controls the randomness / creativity of text generation.

`topp` - Only samples from the smallest set of tokens whose cumulative probability exceeds topp.

`minP` - Minimum probability threshold: tokens with prob < minP \* max_prob are excluded. 0 disables filtering.

`repetitionPenalty` - Multiplicative penalty applied to logits of recently generated tokens. Values > 1 discourage repetition. 1 disables the penalty.

---

### toolsConfig?

> `optional` **toolsConfig**: [`ToolsConfig`](ToolsConfig.md)

Defined in: [types/llm.ts:250](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L250)

Object configuring options for enabling and managing tool use. **It will only have effect if your model's chat template support it**. Contains following properties:

`tools` - List of objects defining tools.

`executeToolCallback` - Function that accepts `ToolCall`, executes tool and returns the string to model.

`displayToolCalls` - If set to true, JSON tool calls will be displayed in chat. If false, only answers will be displayed.
