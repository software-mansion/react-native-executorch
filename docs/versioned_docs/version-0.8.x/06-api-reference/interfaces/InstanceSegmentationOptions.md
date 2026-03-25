# Interface: InstanceSegmentationOptions\<L\>

Defined in: [types/instanceSegmentation.ts:44](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L44)

Options for instance segmentation forward pass.

## Type Parameters

### L

`L` *extends* [`LabelEnum`](../type-aliases/LabelEnum.md)

The label map type for the model, must conform to [LabelEnum](../type-aliases/LabelEnum.md).

## Properties

### classesOfInterest?

> `optional` **classesOfInterest**: keyof `L`[]

Defined in: [types/instanceSegmentation.ts:62](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L62)

Filter to include only specific classes.

***

### confidenceThreshold?

> `optional` **confidenceThreshold**: `number`

Defined in: [types/instanceSegmentation.ts:49](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L49)

Minimum confidence threshold for including instances.
Defaults to model's defaultConfidenceThreshold (typically 0.5).

***

### inputSize?

> `optional` **inputSize**: `number`

Defined in: [types/instanceSegmentation.ts:72](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L72)

Input size for the model (e.g., 384, 512, 640).
Must be one of the model's availableInputSizes.
Defaults to model's defaultInputSize.

***

### iouThreshold?

> `optional` **iouThreshold**: `number`

Defined in: [types/instanceSegmentation.ts:54](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L54)

IoU threshold for non-maximum suppression.
Defaults to model's defaultIouThreshold (typically 0.5).

***

### maxInstances?

> `optional` **maxInstances**: `number`

Defined in: [types/instanceSegmentation.ts:58](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L58)

Maximum number of instances to return. Default: 100

***

### returnMaskAtOriginalResolution?

> `optional` **returnMaskAtOriginalResolution**: `boolean`

Defined in: [types/instanceSegmentation.ts:66](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L66)

Whether to return masks at original image resolution. Default: true
