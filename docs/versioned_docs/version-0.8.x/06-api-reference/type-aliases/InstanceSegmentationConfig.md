# Type Alias: InstanceSegmentationConfig\<T\>

> **InstanceSegmentationConfig**\<`T`\> = `object` & \{ `availableInputSizes`: readonly `number`[]; `defaultInputSize`: `number`; \} \| \{ `availableInputSizes?`: `undefined`; `defaultInputSize?`: `undefined`; \}

Defined in: [types/instanceSegmentation.ts:86](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L86)

Configuration for an instance segmentation model.

## Type Declaration

### defaultConfidenceThreshold?

> `optional` **defaultConfidenceThreshold**: `number`

### defaultIouThreshold?

> `optional` **defaultIouThreshold**: `number`

### labelMap

> **labelMap**: `T`

### postprocessorConfig?

> `optional` **postprocessorConfig**: `object`

#### postprocessorConfig.applyNMS?

> `optional` **applyNMS**: `boolean`

### preprocessorConfig?

> `optional` **preprocessorConfig**: `object`

#### preprocessorConfig.normMean?

> `optional` **normMean**: [`Triple`](Triple.md)\<`number`\>

#### preprocessorConfig.normStd?

> `optional` **normStd**: [`Triple`](Triple.md)\<`number`\>

## Type Parameters

### T

`T` *extends* [`LabelEnum`](LabelEnum.md)

The label map type for the model, must conform to [LabelEnum](LabelEnum.md).

## Remarks

The `availableInputSizes` and `defaultInputSize` fields are mutually inclusive:
- **Either both must be provided** (for models with multiple input sizes), or
- **Both must be omitted** (for models with a single input size).

This discriminated union ensures type safety and prevents partial configuration.
