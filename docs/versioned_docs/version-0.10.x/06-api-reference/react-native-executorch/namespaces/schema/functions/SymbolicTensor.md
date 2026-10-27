# Function: SymbolicTensor()

> **SymbolicTensor**(`dtype`, `shape`): [`TensorSpec`](../type-aliases/TensorSpec.md)\<[`SymbolicDim`](../type-aliases/SymbolicDim.md)\>

Defined in: [core/schema.ts:330](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L330)

Creates a [TensorSpec](../type-aliases/TensorSpec.md) from a dtype and a [SymbolicShape](../type-aliases/SymbolicShape.md):
numbers become [ConstantDim](ConstantDim.md), strings become [StaticDim](StaticDim.md).

## Parameters

### dtype

[`DType`](../../../../type-aliases/DType.md)

The expected element data type.

### shape

[`SymbolicShape`](../type-aliases/SymbolicShape.md)

The per-dimension specs.

## Returns

[`TensorSpec`](../type-aliases/TensorSpec.md)\<[`SymbolicDim`](../type-aliases/SymbolicDim.md)\>

The tensor spec.
