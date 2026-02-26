# Interface: ObjectDetectionProps

Defined in: [types/objectDetection.ts:136](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L136)

Props for the `useObjectDetection` hook.

## Properties

### model

> **model**: `object`

Defined in: [types/objectDetection.ts:137](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L137)

An object containing the model source.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/objectDetection.ts:138](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L138)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
