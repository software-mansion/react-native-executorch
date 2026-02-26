# Interface: ImageSegmentationProps\<C\>

Defined in: [types/imageSegmentation.ts:85](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/imageSegmentation.ts#L85)

Props for the `useImageSegmentation` hook.

## Type Parameters

### C

`C` _extends_ [`ModelSources`](../type-aliases/ModelSources.md)

A [ModelSources](../type-aliases/ModelSources.md) config specifying which built-in model to load.

## Properties

### model

> **model**: `C`

Defined in: [types/imageSegmentation.ts:86](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/imageSegmentation.ts#L86)

The model config containing `modelName` and `modelSource`.

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/imageSegmentation.ts:87](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/imageSegmentation.ts#L87)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
