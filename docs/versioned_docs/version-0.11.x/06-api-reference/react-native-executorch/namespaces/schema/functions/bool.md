# Function: bool()

> **bool**(...`shape`): [`TensorSpec`](../type-aliases/TensorSpec.md)\<[`SymbolicDim`](../type-aliases/SymbolicDim.md)\>

Defined in: [core/schema.ts:373](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/schema.ts#L373)

Shorthand for `SymbolicTensor('bool', shape)`.

## Parameters

### shape

...[`SymbolicShape`](../type-aliases/SymbolicShape.md)

Dimension sizes of the tensor.

## Returns

[`TensorSpec`](../type-aliases/TensorSpec.md)\<[`SymbolicDim`](../type-aliases/SymbolicDim.md)\>

A [SymbolicTensor](SymbolicTensor.md) with `bool` data type.
