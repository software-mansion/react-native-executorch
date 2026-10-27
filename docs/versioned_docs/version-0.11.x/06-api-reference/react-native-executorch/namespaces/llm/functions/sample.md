# Function: sample()

> **sample**(`logits`, `ctx`, `config?`): `number`

Defined in: [extensions/llm/sampler.ts:172](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/sampler.ts#L172)

Samples a token directly from a native logits tensor given generation context and config.

**Important:** The logits buffer is written to in place (penalties, DRY and constraints are
applied directly to it), so its contents are undefined after this call. Copy
the tensor first if the original logits are still needed.

## Parameters

### logits

[`Tensor`](../../../../type-aliases/Tensor.md)

Float32 logits Tensor. Clobbered by the call.

### ctx

[`SamplingContext`](../type-aliases/SamplingContext.md)

Generation context containing emitted token history.

### config?

[`SamplingConfig`](../type-aliases/SamplingConfig.md) = `{}`

Optional sampling configuration (defaults to `{}`).

## Returns

`number`

The sampled token id.

## Throws

With code `RESOURCE_BUSY` if the logits tensor is
locked by another thread, or `INVALID_ARGUMENT` if the options are out of range.
