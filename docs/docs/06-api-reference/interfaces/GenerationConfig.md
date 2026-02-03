# Interface: GenerationConfig

Defined in: [packages/react-native-executorch/src/types/llm.ts:236](https://github.com/software-mansion/react-native-executorch/blob/a4873616eca46e680b6c0a064462c773420037bc/packages/react-native-executorch/src/types/llm.ts#L236)

Object configuring generation settings.

## Properties

### batchTimeInterval?

> `optional` **batchTimeInterval**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:240](https://github.com/software-mansion/react-native-executorch/blob/a4873616eca46e680b6c0a064462c773420037bc/packages/react-native-executorch/src/types/llm.ts#L240)

Upper limit on the time interval between consecutive token batches.

---

### outputTokenBatchSize?

> `optional` **outputTokenBatchSize**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:239](https://github.com/software-mansion/react-native-executorch/blob/a4873616eca46e680b6c0a064462c773420037bc/packages/react-native-executorch/src/types/llm.ts#L239)

Soft upper limit on the number of tokens in each token batch (in certain cases there can be more tokens in given batch, i.e. when the batch would end with special emoji join character).

---

### temperature?

> `optional` **temperature**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:237](https://github.com/software-mansion/react-native-executorch/blob/a4873616eca46e680b6c0a064462c773420037bc/packages/react-native-executorch/src/types/llm.ts#L237)

Scales output logits by the inverse of temperature. Controls the randomness / creativity of text generation.

---

### topp?

> `optional` **topp**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:238](https://github.com/software-mansion/react-native-executorch/blob/a4873616eca46e680b6c0a064462c773420037bc/packages/react-native-executorch/src/types/llm.ts#L238)

Only samples from the smallest set of tokens whose cumulative probability exceeds topp.
