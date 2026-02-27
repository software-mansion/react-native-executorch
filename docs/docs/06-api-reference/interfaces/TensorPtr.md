# Interface: TensorPtr

Defined in: [types/common.ts:130](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/common.ts#L130)

Represents a pointer to a tensor, including its data buffer, size dimensions, and scalar type.

## Properties

### dataPtr

> **dataPtr**: [`TensorBuffer`](../type-aliases/TensorBuffer.md)

Defined in: [types/common.ts:131](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/common.ts#L131)

The data buffer of the tensor.

---

### scalarType

> **scalarType**: [`ScalarType`](../enumerations/ScalarType.md)

Defined in: [types/common.ts:133](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/common.ts#L133)

The scalar type of the tensor, as defined in the `ScalarType` enum.

---

### sizes

> **sizes**: `number`[]

Defined in: [types/common.ts:132](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/common.ts#L132)

An array representing the size of each dimension of the tensor.
