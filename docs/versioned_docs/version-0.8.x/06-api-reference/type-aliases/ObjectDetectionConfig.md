# Type Alias: ObjectDetectionConfig\<T\>

> **ObjectDetectionConfig**\<`T`\> = `object` & \{ `availableInputSizes`: readonly `number`[]; `defaultInputSize`: `number`; \} \| \{ `availableInputSizes?`: `undefined`; `defaultInputSize?`: `undefined`; \}

Defined in: [types/objectDetection.ts:82](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/objectDetection.ts#L82)

Configuration for a custom object detection model.

## Type Declaration

### defaultDetectionThreshold?

> `optional` **defaultDetectionThreshold**: `number`

### defaultIouThreshold?

> `optional` **defaultIouThreshold**: `number`

### labelMap

> **labelMap**: `T`

### preprocessorConfig?

> `optional` **preprocessorConfig**: `object`

#### preprocessorConfig.normMean?

> `optional` **normMean**: [`Triple`](Triple.md)\<`number`\>

#### preprocessorConfig.normStd?

> `optional` **normStd**: [`Triple`](Triple.md)\<`number`\>

## Type Parameters

### T

`T` *extends* [`LabelEnum`](LabelEnum.md)

The label enum type for the model.
