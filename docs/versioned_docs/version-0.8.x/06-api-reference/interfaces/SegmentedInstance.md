# Interface: SegmentedInstance\<L\>

Defined in: [types/instanceSegmentation.ts:30](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L30)

Represents a single detected instance in instance segmentation output.

## Type Parameters

### L

`L` *extends* [`LabelEnum`](../type-aliases/LabelEnum.md)

The label map type for the model, must conform to [LabelEnum](../type-aliases/LabelEnum.md).

## Properties

### bbox

> **bbox**: [`Bbox`](Bbox.md)

Defined in: [types/instanceSegmentation.ts:31](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L31)

The bounding box of the instance.

***

### label

> **label**: keyof `L`

Defined in: [types/instanceSegmentation.ts:35](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L35)

The class label of the instance.

***

### mask

> **mask**: `Uint8Array`

Defined in: [types/instanceSegmentation.ts:32](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L32)

Binary mask (0 or 1) representing the instance.

***

### maskHeight

> **maskHeight**: `number`

Defined in: [types/instanceSegmentation.ts:34](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L34)

Height of the mask array.

***

### maskWidth

> **maskWidth**: `number`

Defined in: [types/instanceSegmentation.ts:33](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L33)

Width of the mask array.

***

### score

> **score**: `number`

Defined in: [types/instanceSegmentation.ts:36](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L36)

Confidence score [0, 1].
