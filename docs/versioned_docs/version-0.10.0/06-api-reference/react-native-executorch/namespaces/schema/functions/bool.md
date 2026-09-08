# Function: bool()

> **bool**(...`shape`): [`TensorSpec`](../type-aliases/TensorSpec.md)\<[`SymbolicDim`](../type-aliases/SymbolicDim.md)\>

Defined in: [core/schema.ts:373](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L373)

Shorthand for `SymbolicTensor('bool', shape)`.

## Parameters

### shape

...[`SymbolicShape`](../type-aliases/SymbolicShape.md)

Dimension sizes of the tensor.

## Returns

[`TensorSpec`](../type-aliases/TensorSpec.md)\<[`SymbolicDim`](../type-aliases/SymbolicDim.md)\>

A [SymbolicTensor](SymbolicTensor.md) with `bool` data type.
