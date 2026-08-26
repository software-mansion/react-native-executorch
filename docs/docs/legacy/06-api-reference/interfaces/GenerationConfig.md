# Interface: GenerationConfig

Defined in: [types/llm.ts:350](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L350)

Object configuring generation settings.

## Properties

### batchTimeInterval?

> `optional` **batchTimeInterval**: `number`

Defined in: [types/llm.ts:358](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L358)

Upper limit on the time interval between consecutive token batches.

---

### minP?

> `optional` **minP**: `number`

Defined in: [types/llm.ts:355](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L355)

Minimum probability threshold: tokens with prob < minP \* max_prob are excluded. 0 disables filtering.

---

### outputTokenBatchSize?

> `optional` **outputTokenBatchSize**: `number`

Defined in: [types/llm.ts:357](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L357)

Soft upper limit on the number of tokens in each token batch (in certain cases there can be more tokens in given batch, i.e. when the batch would end with special emoji join character).

---

### repetitionPenalty?

> `optional` **repetitionPenalty**: `number`

Defined in: [types/llm.ts:356](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L356)

Multiplicative penalty applied to logits of recently generated tokens. Values > 1 discourage repetition. 1 disables the penalty.

---

### temperature?

> `optional` **temperature**: `number`

Defined in: [types/llm.ts:351](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L351)

Scales output logits by the inverse of temperature. Controls the randomness / creativity of text generation.

---

### topp?

> `optional` **topp**: `number`

Defined in: [types/llm.ts:354](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L354)

**Deprecated.** Use `topP` instead.

---

### topP?

> `optional` **topP**: `number`

Defined in: [types/llm.ts:352](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L352)

Only samples from the smallest set of tokens whose cumulative probability exceeds topP.
