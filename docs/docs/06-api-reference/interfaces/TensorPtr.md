# Interface: TensorPtr

Defined in: [packages/react-native-executorch/src/types/common.ts:134](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/common.ts#L134)

Represents a pointer to a tensor, including its data buffer, size dimensions, and scalar type.

## Properties

### dataPtr

> **dataPtr**: [`TensorBuffer`](../type-aliases/TensorBuffer.md)

Defined in: [packages/react-native-executorch/src/types/common.ts:135](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/common.ts#L135)

The data buffer of the tensor.

***

### scalarType

> **scalarType**: [`ScalarType`](../enumerations/ScalarType.md)

Defined in: [packages/react-native-executorch/src/types/common.ts:137](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/common.ts#L137)

The scalar type of the tensor, as defined in the `ScalarType` enum.

***

### sizes

> **sizes**: `number`[]

Defined in: [packages/react-native-executorch/src/types/common.ts:136](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/common.ts#L136)

An array representing the size of each dimension of the tensor.
