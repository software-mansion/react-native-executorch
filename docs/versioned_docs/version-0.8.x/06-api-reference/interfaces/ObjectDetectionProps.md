# Interface: ObjectDetectionProps\<C\>

Defined in: [types/objectDetection.ts:105](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/objectDetection.ts#L105)

Props for the `useObjectDetection` hook.

## Type Parameters

### C

`C` *extends* [`ObjectDetectionModelSources`](../type-aliases/ObjectDetectionModelSources.md)

A [ObjectDetectionModelSources](../type-aliases/ObjectDetectionModelSources.md) config specifying which built-in model to load.

## Properties

### model

> **model**: `C`

Defined in: [types/objectDetection.ts:106](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/objectDetection.ts#L106)

The model config containing `modelName` and `modelSource`.

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/objectDetection.ts:107](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/objectDetection.ts#L107)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
