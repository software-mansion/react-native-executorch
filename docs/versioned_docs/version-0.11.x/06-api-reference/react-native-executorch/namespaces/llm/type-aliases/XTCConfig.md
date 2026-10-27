# Type Alias: XTCConfig

> **XTCConfig** = `object`

Defined in: [extensions/llm/sampler.ts:78](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L78)

Configuration options for Exclude Top Choices (XTC) sampling.

## Properties

### probability

> `readonly` **probability**: `number`

Defined in: [extensions/llm/sampler.ts:84](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L84)

Probability of excluding the top choice when multiple candidates meet the
threshold, in `[0, 1]`. Required: it is the knob that turns XTC on, so it
has no default — a `0` default would make an enabled `xtc` a silent no-op.

---

### threshold?

> `readonly` `optional` **threshold**: `number`

Defined in: [extensions/llm/sampler.ts:88](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L88)

Probability threshold for plausible tokens, in `[0, 0.5]`. Defaults to 0.1.
