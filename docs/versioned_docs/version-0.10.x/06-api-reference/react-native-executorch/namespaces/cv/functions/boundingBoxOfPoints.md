# Function: boundingBoxOfPoints()

> **boundingBoxOfPoints**\<`F`\>(`points`, `format`): [`BoundingBox`](../type-aliases/BoundingBox.md)\<`F`\>

Defined in: [extensions/cv/ops/quad.ts:33](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/quad.ts#L33)

Computes the axis-aligned bounding box enclosing a set of points, in the
requested box format. Returns a zero box for empty input.

## Type Parameters

### F

`F` _extends_ `"xyxy"` \| `"xywh"` \| `"cxcywh"`

Bounding box coordinate format.

## Parameters

### points

readonly [`Point`](../type-aliases/Point.md)[]

The points to enclose.

### format

`F`

The coordinate format of the returned box.

## Returns

[`BoundingBox`](../type-aliases/BoundingBox.md)\<`F`\>

The enclosing [BoundingBox](../type-aliases/BoundingBox.md) in `format`.

## Throws

With code `INVALID_ARGUMENT` if the bounding box
format is unsupported.
