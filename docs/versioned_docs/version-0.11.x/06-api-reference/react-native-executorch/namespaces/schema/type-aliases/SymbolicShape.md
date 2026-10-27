# Type Alias: SymbolicShape

> **SymbolicShape** = readonly (`number` \| `string` \| [`SymbolicDim`](SymbolicDim.md))[]

Defined in: [core/schema.ts:226](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/schema.ts#L226)

Shape notation accepted by [SymbolicTensor](../functions/SymbolicTensor.md): numbers become
[ConstantDim](../functions/ConstantDim.md), strings become [StaticDim](../functions/StaticDim.md), and
[SymbolicDim](SymbolicDim.md) values are used as-is.
