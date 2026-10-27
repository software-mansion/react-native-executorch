# Type Alias: SamplingConfig

> **SamplingConfig** = `object`

Defined in: [extensions/llm/sampler.ts:95](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L95)

Configuration options for LLM token sampling.

## Properties

### constraints?

> `readonly` `optional` **constraints**: [`SamplingConstraintsCallback`](SamplingConstraintsCallback.md)

Defined in: [extensions/llm/sampler.ts:129](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L129)

Optional callback for dynamic token constraints and guided decoding (e.g.
JSON schemas, grammars, choice whitelists, stop tokens).

---

### dry?

> `readonly` `optional` **dry**: [`DryConfig`](DryConfig.md)

Defined in: [extensions/llm/sampler.ts:122](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L122)

Configuration for Don't Repeat Yourself (DRY) repetition penalty.

---

### minP?

> `readonly` `optional` **minP**: `number`

Defined in: [extensions/llm/sampler.ts:106](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L106)

Minimum token probability relative to the most likely token, in `[0, 1)`. Defaults to 0.05.

---

### penaltyLastN?

> `readonly` `optional` **penaltyLastN**: `number`

Defined in: [extensions/llm/sampler.ts:116](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L116)

Maximum number of recent tokens to consider for repetition penalty.
Defaults to -1 (entire context).

---

### repetitionPenalty?

> `readonly` `optional` **repetitionPenalty**: `number`

Defined in: [extensions/llm/sampler.ts:111](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L111)

Penalty applied to previously generated tokens. Values greater than 1
discourage repetition. Defaults to 1.0 (disabled).

---

### seed?

> `readonly` `optional` **seed**: `number`

Defined in: [extensions/llm/sampler.ts:120](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L120)

Optional RNG seed for deterministic sampling. Must be a non-negative 32-bit integer.

---

### temperature?

> `readonly` `optional` **temperature**: `number`

Defined in: [extensions/llm/sampler.ts:100](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L100)

Sampling temperature. Values below 1 sharpen the distribution, while values
above 1 flatten it. Set to 0 for greedy decoding. Defaults to 0.8.

---

### topK?

> `readonly` `optional` **topK**: `number`

Defined in: [extensions/llm/sampler.ts:102](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L102)

Number of highest-probability tokens to retain, `>= 1`. Use `1` for greedy decoding. Defaults to 40.

---

### topP?

> `readonly` `optional` **topP**: `number`

Defined in: [extensions/llm/sampler.ts:104](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L104)

Cumulative probability threshold for nucleus sampling, in `(0, 1]`. Defaults to 0.95.

---

### xtc?

> `readonly` `optional` **xtc**: [`XTCConfig`](XTCConfig.md)

Defined in: [extensions/llm/sampler.ts:124](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L124)

Configuration for Exclude Top Choices (XTC) sampling.
