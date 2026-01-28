# Interface: GenerationConfig

Defined in: [packages/react-native-executorch/src/types/llm.ts:211](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L211)

Object configuring generation settings.

## Properties

### batchTimeInterval?

> `optional` **batchTimeInterval**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:215](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L215)

Upper limit on the time interval between consecutive token batches.

***

### outputTokenBatchSize?

> `optional` **outputTokenBatchSize**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:214](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L214)

Soft upper limit on the number of tokens in each token batch (in certain cases there can be more tokens in given batch, i.e. when the batch would end with special emoji join character).

***

### temperature?

> `optional` **temperature**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:212](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L212)

Scales output logits by the inverse of temperature. Controls the randomness / creativity of text generation.

***

### topp?

> `optional` **topp**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:213](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/llm.ts#L213)

Only samples from the smallest set of tokens whose cumulative probability exceeds topp.
