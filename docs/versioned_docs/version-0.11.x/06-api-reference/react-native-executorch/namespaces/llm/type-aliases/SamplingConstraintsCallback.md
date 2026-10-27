# Type Alias: SamplingConstraintsCallback()

> **SamplingConstraintsCallback** = (`ctx`) => [`SamplingConstraints`](SamplingConstraints.md) \| `undefined`

Defined in: [extensions/llm/sampler.ts:42](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L42)

Callback invoked before token selection to dynamically apply token constraints.

## Parameters

### ctx

[`SamplingContext`](SamplingContext.md)

Generation context containing emitted tokens.

## Returns

[`SamplingConstraints`](SamplingConstraints.md) \| `undefined`

Constraints specifying allowed or banned tokens.
