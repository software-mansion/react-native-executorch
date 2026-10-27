# Type Alias: DryConfig

> **DryConfig** = `object`

Defined in: [extensions/llm/sampler.ts:50](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L50)

Configuration options for Don't Repeat Yourself (DRY) repetition penalty.

Penalizes tokens that would extend an already repeated n-gram sequence.

## Properties

### allowedLength?

> `readonly` `optional` **allowedLength**: `number`

Defined in: [extensions/llm/sampler.ts:62](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L62)

Minimum match length before penalty is applied. Defaults to 2.

---

### base?

> `readonly` `optional` **base**: `number`

Defined in: [extensions/llm/sampler.ts:58](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L58)

Exponential penalty base. Defaults to 1.75.

---

### multiplier

> `readonly` **multiplier**: `number`

Defined in: [extensions/llm/sampler.ts:54](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L54)

Multiplier penalty factor (e.g. 0.8). Set to 0 to disable.

---

### penaltyLastN?

> `readonly` `optional` **penaltyLastN**: `number`

Defined in: [extensions/llm/sampler.ts:67](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L67)

Maximum number of recent tokens to consider (window). Defaults to -1
(entire context).

---

### sequenceBreakers?

> `readonly` `optional` **sequenceBreakers**: `Int32Array`

Defined in: [extensions/llm/sampler.ts:71](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L71)

Sequence-breaking token IDs (e.g. newlines) that reset n-gram matching.
