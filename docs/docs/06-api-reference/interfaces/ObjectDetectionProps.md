# Interface: ObjectDetectionProps

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:135](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/objectDetection.ts#L135)

Props for the `useObjectDetection` hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:136](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/objectDetection.ts#L136)

An object containing the model source.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:137](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/objectDetection.ts#L137)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
