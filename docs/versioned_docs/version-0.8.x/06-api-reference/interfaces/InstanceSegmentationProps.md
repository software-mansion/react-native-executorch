# Interface: InstanceSegmentationProps\<C\>

Defined in: [types/instanceSegmentation.ts:140](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L140)

Props for the `useInstanceSegmentation` hook.

## Type Parameters

### C

`C` *extends* [`InstanceSegmentationModelSources`](../type-aliases/InstanceSegmentationModelSources.md)

A [InstanceSegmentationModelSources](../type-aliases/InstanceSegmentationModelSources.md) config specifying which built-in model to load.

## Properties

### model

> **model**: `C`

Defined in: [types/instanceSegmentation.ts:143](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L143)

The model config containing `modelName` and `modelSource`.

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/instanceSegmentation.ts:144](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L144)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
