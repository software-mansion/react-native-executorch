# Interface: ObjectDetectionProps\<C\>

Defined in: [types/objectDetection.ts:105](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/objectDetection.ts#L105)

Props for the `useObjectDetection` hook.

## Type Parameters

### C

`C` _extends_ [`ObjectDetectionModelSources`](../type-aliases/ObjectDetectionModelSources.md)

A [ObjectDetectionModelSources](../type-aliases/ObjectDetectionModelSources.md) config specifying which built-in model to load.

## Properties

### model

> **model**: `C`

Defined in: [types/objectDetection.ts:106](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/objectDetection.ts#L106)

The model config containing `modelName` and `modelSource`.

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/objectDetection.ts:107](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/objectDetection.ts#L107)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
