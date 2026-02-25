# Type Alias: ObjectDetectionConfig\<T\>

> **ObjectDetectionConfig**\<`T`\> = `object`

Defined in: [types/objectDetection.ts:58](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L58)

Configuration for a custom object detection model.

## Type Parameters

### T

`T` _extends_ [`LabelEnum`](LabelEnum.md)

## Properties

### labelMap

> **labelMap**: `T`

Defined in: [types/objectDetection.ts:59](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L59)

---

### preprocessorConfig?

> `optional` **preprocessorConfig**: `object`

Defined in: [types/objectDetection.ts:60](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L60)

#### normMean?

> `optional` **normMean**: [`Triple`](Triple.md)\<`number`\>

#### normStd?

> `optional` **normStd**: [`Triple`](Triple.md)\<`number`\>
