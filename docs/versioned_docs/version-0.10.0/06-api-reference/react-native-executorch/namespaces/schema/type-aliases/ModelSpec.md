# Type Alias: ModelSpec\<Dim\>

> **ModelSpec**\<`Dim`\> = `Record`\<`string`, [`MethodSpec`](MethodSpec.md)\<`Dim`\>\>

Defined in: [core/schema.ts:214](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L214)

Spec of a whole model, mapping method names to their [MethodSpec](MethodSpec.md).
A `SymbolicDim` spec describes allowed models; a `ConcreteDim` spec
describes an exported model.

## Type Parameters

### Dim

`Dim` _extends_ [`SymbolicDim`](SymbolicDim.md)
