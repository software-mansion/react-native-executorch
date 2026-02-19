# Type Alias: SegmentationConfig\<T\>

> **SegmentationConfig**\<`T`\> = `object`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:15](https://github.com/software-mansion/react-native-executorch/blob/ec04754e2ea2ad38fe30c36a9250db47f020a06e/packages/react-native-executorch/src/types/imageSegmentation.ts#L15)

Configuration for a custom segmentation model.

## Type Parameters

### T

`T` _extends_ [`LabelEnum`](LabelEnum.md)

The [LabelEnum](LabelEnum.md) type for the model.

## Properties

### labelMap

> **labelMap**: `T`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:16](https://github.com/software-mansion/react-native-executorch/blob/ec04754e2ea2ad38fe30c36a9250db47f020a06e/packages/react-native-executorch/src/types/imageSegmentation.ts#L16)

The enum-like object mapping class names to indices.

---

### preprocessorConfig?

> `optional` **preprocessorConfig**: `object`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:17](https://github.com/software-mansion/react-native-executorch/blob/ec04754e2ea2ad38fe30c36a9250db47f020a06e/packages/react-native-executorch/src/types/imageSegmentation.ts#L17)

Optional preprocessing parameters.

#### normMean?

> `optional` **normMean**: [`Triple`](Triple.md)\<`number`\>

#### normStd?

> `optional` **normStd**: [`Triple`](Triple.md)\<`number`\>
