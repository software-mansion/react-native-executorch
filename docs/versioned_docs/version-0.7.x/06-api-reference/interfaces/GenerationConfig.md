# Interface: GenerationConfig

Defined in: [packages/react-native-executorch/src/types/llm.ts:247](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/llm.ts#L247)

Object configuring generation settings.

## Properties

### batchTimeInterval?

> `optional` **batchTimeInterval**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:251](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/llm.ts#L251)

Upper limit on the time interval between consecutive token batches.

---

### outputTokenBatchSize?

> `optional` **outputTokenBatchSize**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:250](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/llm.ts#L250)

Soft upper limit on the number of tokens in each token batch (in certain cases there can be more tokens in given batch, i.e. when the batch would end with special emoji join character).

---

### temperature?

> `optional` **temperature**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:248](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/llm.ts#L248)

Scales output logits by the inverse of temperature. Controls the randomness / creativity of text generation.

---

### topp?

> `optional` **topp**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:249](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/llm.ts#L249)

Only samples from the smallest set of tokens whose cumulative probability exceeds topp.
