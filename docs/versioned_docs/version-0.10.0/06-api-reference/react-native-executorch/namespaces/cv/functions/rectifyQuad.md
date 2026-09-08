# Function: rectifyQuad()

> **rectifyQuad**(`src`, `dst`, `quad`, `options`): [`Tensor`](../../../../type-aliases/Tensor.md)

Defined in: [extensions/cv/ops/quad.ts:174](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/quad.ts#L174)

Rectifies an oriented quad region of `src` into the flat pre-allocated canvas
`dst`: perspective crop, resize to the canvas height, and pad, in one native
pass. An axis-aligned bbox is a 4-corner quad, so pass its corners to
rectify a box.

## Parameters

### src

[`Tensor`](../../../../type-aliases/Tensor.md)

The source image, `uint8` `[H, W, C]`.

### dst

[`Tensor`](../../../../type-aliases/Tensor.md)

The pre-allocated destination canvas, `uint8` `[H', W', C]`, with
the same channel count as `src`. Must not alias `src`.

### quad

[`Quad`](../type-aliases/Quad.md)

The region corners (TL, TR, BR, BL) in `src` pixels.

### options

[`RectifyQuadOptions`](../type-aliases/RectifyQuadOptions.md)

Content width, alignment, and padding. See [RectifyQuadOptions](../type-aliases/RectifyQuadOptions.md).

## Returns

[`Tensor`](../../../../type-aliases/Tensor.md)

The destination tensor `dst`.

## Throws

With code `INVALID_ARGUMENT` if tensor shapes,
data types, or quadrilateral coordinates are invalid, `RESOURCE_BUSY` if a
tensor is in use, or `RESOURCE_DISPOSED` if either tensor was disposed.
