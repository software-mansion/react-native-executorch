# Interface: GenerationConfig

Defined in: [packages/react-native-executorch/src/types/llm.ts:238](https://github.com/software-mansion/react-native-executorch/blob/bf7cb740914337a4d266d2cb99d42114c1e469b1/packages/react-native-executorch/src/types/llm.ts#L238)

Object configuring generation settings.

## Properties

### batchTimeInterval?

> `optional` **batchTimeInterval**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:242](https://github.com/software-mansion/react-native-executorch/blob/bf7cb740914337a4d266d2cb99d42114c1e469b1/packages/react-native-executorch/src/types/llm.ts#L242)

Upper limit on the time interval between consecutive token batches.

***

### outputTokenBatchSize?

> `optional` **outputTokenBatchSize**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:241](https://github.com/software-mansion/react-native-executorch/blob/bf7cb740914337a4d266d2cb99d42114c1e469b1/packages/react-native-executorch/src/types/llm.ts#L241)

Soft upper limit on the number of tokens in each token batch (in certain cases there can be more tokens in given batch, i.e. when the batch would end with special emoji join character).

***

### temperature?

> `optional` **temperature**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:239](https://github.com/software-mansion/react-native-executorch/blob/bf7cb740914337a4d266d2cb99d42114c1e469b1/packages/react-native-executorch/src/types/llm.ts#L239)

Scales output logits by the inverse of temperature. Controls the randomness / creativity of text generation.

***

### topp?

> `optional` **topp**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:240](https://github.com/software-mansion/react-native-executorch/blob/bf7cb740914337a4d266d2cb99d42114c1e469b1/packages/react-native-executorch/src/types/llm.ts#L240)

Only samples from the smallest set of tokens whose cumulative probability exceeds topp.
