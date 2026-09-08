# Function: decodeBox()

> **decodeBox**\<`F`\>(`tuple`, `format`): [`BoundingBox`](../type-aliases/BoundingBox.md)\<`F`\>

Defined in: [extensions/cv/ops/box.ts:57](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/box.ts#L57)

Decodes bounding box coordinates from a 4-tuple into a structured BoundingBox
object.

## Type Parameters

### F

`F` _extends_ `"xyxy"` \| `"xywh"` \| `"cxcywh"`

Bounding box coordinate format.

## Parameters

### tuple

\[`number`, `number`, `number`, `number`\]

A 4-tuple array containing coordinates.

### format

`F`

The coordinate format to decode into.

## Returns

[`BoundingBox`](../type-aliases/BoundingBox.md)\<`F`\>

The decoded BoundingBox object.
