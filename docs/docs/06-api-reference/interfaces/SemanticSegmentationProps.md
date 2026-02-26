# Interface: SemanticSegmentationProps\<C\>

Defined in: [types/semanticSegmentation.ts:92](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/semanticSegmentation.ts#L92)

Props for the `useSemanticSegmentation` hook.

## Type Parameters

### C

`C` _extends_ [`SemanticSegmentationModelSources`](../type-aliases/SemanticSegmentationModelSources.md)

A [SemanticSegmentationModelSources](../type-aliases/SemanticSegmentationModelSources.md) config specifying which built-in model to load.

## Properties

### model

> **model**: `C`

Defined in: [types/semanticSegmentation.ts:95](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/semanticSegmentation.ts#L95)

The model config containing `modelName` and `modelSource`.

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/semanticSegmentation.ts:96](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/semanticSegmentation.ts#L96)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
