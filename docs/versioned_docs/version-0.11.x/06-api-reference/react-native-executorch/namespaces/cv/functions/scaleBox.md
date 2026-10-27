# Function: scaleBox()

> **scaleBox**\<`F`\>(`box`, `options`): [`BoundingBox`](../type-aliases/BoundingBox.md)\<`F`\>

Defined in: [extensions/cv/ops/box.ts:82](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/box.ts#L82)

Scales bounding box coordinates based on scaling options and resize modes.

## Type Parameters

### F

`F` _extends_ `"xyxy"` \| `"xywh"` \| `"cxcywh"`

Bounding box coordinate format.

## Parameters

### box

[`BoundingBox`](../type-aliases/BoundingBox.md)\<`F`\>

The original BoundingBox.

### options

[`ScaleBoxOptions`](../type-aliases/ScaleBoxOptions.md)

Options defining dimensions and resize modes.
See [ScaleBoxOptions](../type-aliases/ScaleBoxOptions.md).

## Returns

[`BoundingBox`](../type-aliases/BoundingBox.md)\<`F`\>

The scaled BoundingBox object.
