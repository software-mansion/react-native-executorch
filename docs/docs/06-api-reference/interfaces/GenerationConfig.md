# Interface: GenerationConfig

Defined in: [packages/react-native-executorch/src/types/llm.ts:194](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/types/llm.ts#L194)

Object configuring generation settings.

## Properties

### batchTimeInterval?

> `optional` **batchTimeInterval**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:213](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/types/llm.ts#L213)

Upper limit on the time interval between consecutive token batches.

***

### outputTokenBatchSize?

> `optional` **outputTokenBatchSize**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:208](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/types/llm.ts#L208)

Soft upper limit on the number of tokens in each token batch (in certain cases there can be more tokens in given batch, i.e. when the batch would end with special emoji join character).

***

### temperature?

> `optional` **temperature**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:198](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/types/llm.ts#L198)

Scales output logits by the inverse of temperature. Controls the randomness / creativity of text generation.

***

### topp?

> `optional` **topp**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:203](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/types/llm.ts#L203)

Only samples from the smallest set of tokens whose cumulative probability exceeds topp.
