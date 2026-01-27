# Interface: TensorPtr

Defined in: [packages/react-native-executorch/src/types/common.ts:61](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/types/common.ts#L61)

Represents a pointer to a tensor, including its data buffer, size dimensions, and scalar type.

## Properties

### dataPtr

> **dataPtr**: [`TensorBuffer`](../type-aliases/TensorBuffer.md)

Defined in: [packages/react-native-executorch/src/types/common.ts:62](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/types/common.ts#L62)

The data buffer of the tensor.

***

### scalarType

> **scalarType**: [`ScalarType`](../enumerations/ScalarType.md)

Defined in: [packages/react-native-executorch/src/types/common.ts:64](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/types/common.ts#L64)

The scalar type of the tensor, as defined in the `ScalarType` enum.

***

### sizes

> **sizes**: `number`[]

Defined in: [packages/react-native-executorch/src/types/common.ts:63](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/types/common.ts#L63)

An array representing the size of each dimension of the tensor.
