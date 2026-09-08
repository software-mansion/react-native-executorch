# Type Alias: TensorSpec\<Dim\>

> **TensorSpec**\<`Dim`\> = `object`

Defined in: [core/schema.ts:114](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L114)

Spec of a tensor parameter: the expected element `dtype` and one
dimension spec per axis.

## Type Parameters

### Dim

`Dim` _extends_ [`SymbolicDim`](SymbolicDim.md)

## Properties

### dtype

> `readonly` **dtype**: [`DType`](../../../../type-aliases/DType.md)

Defined in: [core/schema.ts:116](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L116)

---

### kind

> `readonly` **kind**: `"Tensor"`

Defined in: [core/schema.ts:115](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L115)

---

### shape

> `readonly` **shape**: readonly `Dim`[]

Defined in: [core/schema.ts:117](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L117)
