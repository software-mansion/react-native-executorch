# Type Alias: SamplingConstraints

> **SamplingConstraints** = `object`

Defined in: [extensions/llm/sampler.ts:23](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L23)

Constraints returned by a [SamplingConstraintsCallback](SamplingConstraintsCallback.md) to constrain token
selection.

## Properties

### allowedTokens?

> `readonly` `optional` **allowedTokens**: `Int32Array`

Defined in: [extensions/llm/sampler.ts:28](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L28)

If specified, only these tokens are allowed. All other token logits are
masked to `-Infinity`.

---

### bannedTokens?

> `readonly` `optional` **bannedTokens**: `Int32Array`

Defined in: [extensions/llm/sampler.ts:33](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L33)

If specified, these tokens are forbidden. Their logits are masked to
`-Infinity`.
