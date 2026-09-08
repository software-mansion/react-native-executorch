# Type Alias: SymbolicShape

> **SymbolicShape** = readonly (`number` \| `string` \| [`SymbolicDim`](SymbolicDim.md))[]

Defined in: [core/schema.ts:226](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L226)

Shape notation accepted by [SymbolicTensor](../functions/SymbolicTensor.md): numbers become
[ConstantDim](../functions/ConstantDim.md), strings become [StaticDim](../functions/StaticDim.md), and
[SymbolicDim](SymbolicDim.md) values are used as-is.
