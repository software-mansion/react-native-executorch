# Type Alias: SamplingContext

> **SamplingContext** = `object`

Defined in: [extensions/llm/sampler.ts:13](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L13)

Contextual information available to constraint callbacks and sampling
strategies during generation.

## Properties

### generatedTokens

> `readonly` **generatedTokens**: `Int32Array`

Defined in: [extensions/llm/sampler.ts:15](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L15)

All token ids emitted so far in the current generation call.
