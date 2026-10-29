# Interface: InstanceSegmentationProps\<C\>

Defined in: [types/instanceSegmentation.ts:142](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/instanceSegmentation.ts#L142)

Props for the `useInstanceSegmentation` hook.

## Type Parameters

### C

`C` _extends_ [`InstanceSegmentationModelSources`](../type-aliases/InstanceSegmentationModelSources.md)

A [InstanceSegmentationModelSources](../type-aliases/InstanceSegmentationModelSources.md) config specifying which built-in model to load.

## Properties

### model

> **model**: `C`

Defined in: [types/instanceSegmentation.ts:145](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/instanceSegmentation.ts#L145)

The model config containing `modelName` and `modelSource`.

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/instanceSegmentation.ts:146](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/instanceSegmentation.ts#L146)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
