# Function: selectByBox()

> **selectByBox**\<`L`\>(`instances`, `box`): [`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`L`\> \| `null`

Defined in: [utils/segmentAnythingPrompts.ts:53](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/segmentAnythingPrompts.ts#L53)

Selects the best matching instance for a given box prompt.

Finds all instances that overlap with the prompt box, then returns the one
with the highest IoU with that box (ties broken by highest confidence).

## Type Parameters

### L

`L` _extends_ `Readonly`\<`Record`\<`string`, `string` \| `number`\>\>

## Parameters

### instances

[`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`L`\>[]

Array of segmented instances returned by `forward()`.

### box

[`Bbox`](../interfaces/Bbox.md)

The prompt bounding box in image coordinates.

## Returns

[`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`L`\> \| `null`

The best matching instance, or `null` if no instance overlaps.
