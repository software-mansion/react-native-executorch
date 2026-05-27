# Function: selectByPoint()

> **selectByPoint**\<`L`\>(`instances`, `x`, `y`): [`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`L`\> \| `null`

Defined in: [utils/segmentAnythingPrompts.ts:16](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/segmentAnythingPrompts.ts#L16)

Selects the best matching instance for a given point prompt.

Finds all instances whose mask covers the point (x, y), then returns the one
with the smallest bounding box area (ties broken by highest confidence).

## Type Parameters

### L

`L` _extends_ `Readonly`\<`Record`\<`string`, `string` \| `number`\>\>

## Parameters

### instances

[`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`L`\>[]

Array of segmented instances returned by `forward()`.

### x

`number`

X coordinate in original image space.

### y

`number`

Y coordinate in original image space.

## Returns

[`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`L`\> \| `null`

The best matching instance, or `null` if no mask covers the point.
