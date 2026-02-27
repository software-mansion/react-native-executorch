# Interface: GenerationConfig

Defined in: [types/llm.ts:230](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L230)

Object configuring generation settings.

## Properties

### batchTimeInterval?

> `optional` **batchTimeInterval**: `number`

Defined in: [types/llm.ts:234](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L234)

Upper limit on the time interval between consecutive token batches.

---

### outputTokenBatchSize?

> `optional` **outputTokenBatchSize**: `number`

Defined in: [types/llm.ts:233](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L233)

Soft upper limit on the number of tokens in each token batch (in certain cases there can be more tokens in given batch, i.e. when the batch would end with special emoji join character).

---

### temperature?

> `optional` **temperature**: `number`

Defined in: [types/llm.ts:231](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L231)

Scales output logits by the inverse of temperature. Controls the randomness / creativity of text generation.

---

### topp?

> `optional` **topp**: `number`

Defined in: [types/llm.ts:232](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L232)

Only samples from the smallest set of tokens whose cumulative probability exceeds topp.
