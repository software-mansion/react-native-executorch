# Interface: GenerationConfig

Defined in: [types/llm.ts:327](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L327)

Object configuring generation settings.

## Properties

### batchTimeInterval?

> `optional` **batchTimeInterval**: `number`

Defined in: [types/llm.ts:331](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L331)

Upper limit on the time interval between consecutive token batches.

***

### outputTokenBatchSize?

> `optional` **outputTokenBatchSize**: `number`

Defined in: [types/llm.ts:330](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L330)

Soft upper limit on the number of tokens in each token batch (in certain cases there can be more tokens in given batch, i.e. when the batch would end with special emoji join character).

***

### temperature?

> `optional` **temperature**: `number`

Defined in: [types/llm.ts:328](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L328)

Scales output logits by the inverse of temperature. Controls the randomness / creativity of text generation.

***

### topp?

> `optional` **topp**: `number`

Defined in: [types/llm.ts:329](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L329)

Only samples from the smallest set of tokens whose cumulative probability exceeds topp.
