# Interface: ObjectDetectionProps\<C\>

Defined in: [types/objectDetection.ts:72](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L72)

Props for the `useObjectDetection` hook.

## Type Parameters

### C

`C` _extends_ [`ObjectDetectionModelSources`](../type-aliases/ObjectDetectionModelSources.md)

A [ObjectDetectionModelSources](../type-aliases/ObjectDetectionModelSources.md) config specifying which built-in model to load.

## Properties

### model

> **model**: `C`

Defined in: [types/objectDetection.ts:73](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L73)

The model config containing `modelName` and `modelSource`.

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/objectDetection.ts:74](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L74)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
