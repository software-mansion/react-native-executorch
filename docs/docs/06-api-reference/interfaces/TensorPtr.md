# Interface: TensorPtr

Defined in: [packages/react-native-executorch/src/types/common.ts:127](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/common.ts#L127)

Represents a pointer to a tensor, including its data buffer, size dimensions, and scalar type.

## Properties

### dataPtr

> **dataPtr**: [`TensorBuffer`](../type-aliases/TensorBuffer.md)

Defined in: [packages/react-native-executorch/src/types/common.ts:128](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/common.ts#L128)

The data buffer of the tensor.

***

### scalarType

> **scalarType**: [`ScalarType`](../enumerations/ScalarType.md)

Defined in: [packages/react-native-executorch/src/types/common.ts:130](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/common.ts#L130)

The scalar type of the tensor, as defined in the `ScalarType` enum.

***

### sizes

> **sizes**: `number`[]

Defined in: [packages/react-native-executorch/src/types/common.ts:129](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/common.ts#L129)

An array representing the size of each dimension of the tensor.
