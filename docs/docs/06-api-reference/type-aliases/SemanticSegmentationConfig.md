# Type Alias: SemanticSegmentationConfig\<T\>

> **SemanticSegmentationConfig**\<`T`\> = `object`

Defined in: [types/semanticSegmentation.ts:13](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/semanticSegmentation.ts#L13)

Configuration for a custom semantic segmentation model.

## Type Parameters

### T

`T` _extends_ [`LabelEnum`](LabelEnum.md)

The [LabelEnum](LabelEnum.md) type for the model.

## Properties

### labelMap

> **labelMap**: `T`

Defined in: [types/semanticSegmentation.ts:14](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/semanticSegmentation.ts#L14)

The enum-like object mapping class names to indices.

---

### preprocessorConfig?

> `optional` **preprocessorConfig**: `object`

Defined in: [types/semanticSegmentation.ts:15](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/semanticSegmentation.ts#L15)

Optional preprocessing parameters.

#### normMean?

> `optional` **normMean**: [`Triple`](Triple.md)\<`number`\>

#### normStd?

> `optional` **normStd**: [`Triple`](Triple.md)\<`number`\>
