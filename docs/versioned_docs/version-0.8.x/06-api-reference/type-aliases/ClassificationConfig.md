# Type Alias: ClassificationConfig\<T\>

> **ClassificationConfig**\<`T`\> = `object`

Defined in: [types/classification.ts:15](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/classification.ts#L15)

Configuration for a custom classification model.

## Type Parameters

### T

`T` *extends* [`LabelEnum`](LabelEnum.md)

The [LabelEnum](LabelEnum.md) type for the model.

## Properties

### labelMap

> **labelMap**: `T`

Defined in: [types/classification.ts:16](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/classification.ts#L16)

The enum-like object mapping class names to indices.

***

### preprocessorConfig?

> `optional` **preprocessorConfig**: `object`

Defined in: [types/classification.ts:17](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/classification.ts#L17)

Optional preprocessing parameters.

#### normMean?

> `optional` **normMean**: [`Triple`](Triple.md)\<`number`\>

#### normStd?

> `optional` **normStd**: [`Triple`](Triple.md)\<`number`\>
