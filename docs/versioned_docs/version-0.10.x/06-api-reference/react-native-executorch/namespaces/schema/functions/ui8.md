# Function: ui8()

> **ui8**(...`shape`): [`TensorSpec`](../type-aliases/TensorSpec.md)\<[`SymbolicDim`](../type-aliases/SymbolicDim.md)\>

Defined in: [core/schema.ts:366](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L366)

Shorthand for `SymbolicTensor('uint8', shape)`.

## Parameters

### shape

...[`SymbolicShape`](../type-aliases/SymbolicShape.md)

Dimension sizes of the tensor.

## Returns

[`TensorSpec`](../type-aliases/TensorSpec.md)\<[`SymbolicDim`](../type-aliases/SymbolicDim.md)\>

A [SymbolicTensor](SymbolicTensor.md) with `uint8` data type.
