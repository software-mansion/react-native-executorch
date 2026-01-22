# Interface: GenerationConfig

Defined in: [packages/react-native-executorch/src/types/llm.ts:195](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/types/llm.ts#L195)

Object configuring generation settings.

## Properties

### batchTimeInterval?

> `optional` **batchTimeInterval**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:214](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/types/llm.ts#L214)

Upper limit on the time interval between consecutive token batches.

---

### outputTokenBatchSize?

> `optional` **outputTokenBatchSize**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:209](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/types/llm.ts#L209)

Soft upper limit on the number of tokens in each token batch (in certain cases there can be more tokens in given batch, i.e. when the batch would end with special emoji join character).

---

### temperature?

> `optional` **temperature**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:199](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/types/llm.ts#L199)

Scales output logits by the inverse of temperature. Controls the randomness / creativity of text generation.

---

### topp?

> `optional` **topp**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:204](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/types/llm.ts#L204)

Only samples from the smallest set of tokens whose cumulative probability exceeds topp.
