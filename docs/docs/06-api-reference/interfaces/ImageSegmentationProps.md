# Interface: ImageSegmentationProps\<C\>

Defined in: [types/imageSegmentation.ts:94](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/imageSegmentation.ts#L94)

Props for the `useImageSegmentation` hook.

## Type Parameters

### C

`C` _extends_ [`ModelSources`](../type-aliases/ModelSources.md)

A [ModelSources](../type-aliases/ModelSources.md) config specifying which built-in model to load.

## Properties

### model

> **model**: `C`

Defined in: [types/imageSegmentation.ts:95](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/imageSegmentation.ts#L95)

The model config containing `modelName` and `modelSource`.

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/imageSegmentation.ts:96](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/imageSegmentation.ts#L96)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
