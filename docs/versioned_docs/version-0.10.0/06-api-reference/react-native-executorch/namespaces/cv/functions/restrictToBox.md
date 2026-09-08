# Function: restrictToBox()

> **restrictToBox**(`src`, `dst`, `box`): [`Tensor`](../../../../type-aliases/Tensor.md)

Defined in: [extensions/cv/ops/box.ts:212](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/box.ts#L212)

Masks the source image tensor by keeping only the elements inside the specified
bounding box, writing the result to a pre-allocated destination image tensor.

Note: This operation does not change the image tensor dimensions (it does not crop
the shape). Instead, it copies the elements within the box coordinates from
`src` to `dst`, and sets all elements outside the box to `0`.

## Parameters

### src

[`Tensor`](../../../../type-aliases/Tensor.md)

The source image tensor in HWC layout. Expected shape `[H, W, C]`
(channels-last). Supports any numeric data type.

### dst

[`Tensor`](../../../../type-aliases/Tensor.md)

The pre-allocated destination image tensor to write masked values to.
Expected shape `[H, W, C]` in HWC layout and the same data type as `src`.

### box

The bounding box defining the region of interest to copy.

`object` & `Readonly`\<\{ `xmax`: `number`; `xmin`: `number`; `ymax`: `number`; `ymin`: `number`; \}\> | `object` & `Readonly`\<\{ `h`: `number`; `w`: `number`; `xmin`: `number`; `ymin`: `number`; \}\> | `object` & `Readonly`\<\{ `cx`: `number`; `cy`: `number`; `h`: `number`; `w`: `number`; \}\>

## Returns

[`Tensor`](../../../../type-aliases/Tensor.md)

The destination image tensor containing the masked output of shape
`[H, W, C]` and matching data type.

## Throws

With code `INVALID_ARGUMENT` if tensor shapes,
layouts, or data types are invalid, `RESOURCE_BUSY` if a tensor is in use, or
`RESOURCE_DISPOSED` if either tensor was disposed.
