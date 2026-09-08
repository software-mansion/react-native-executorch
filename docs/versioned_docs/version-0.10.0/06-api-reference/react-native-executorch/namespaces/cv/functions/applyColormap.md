# Function: applyColormap()

> **applyColormap**(`src`, `dst`, `colormap`): [`Tensor`](../../../../type-aliases/Tensor.md)

Defined in: [extensions/cv/ops/image.ts:260](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L260)

Applies a colormap to a single-channel image tensor, mapping class indices to
RGBA colors.

This operation iterates over each index/class ID in the source tensor, looks
up its corresponding RGBA color in the provided colormap palette, and writes
it to the destination tensor.

## Parameters

### src

[`Tensor`](../../../../type-aliases/Tensor.md)

The source index/mask image tensor. Expected shape `[H, W, 1]` in
HWC layout with data type `int32` containing class indices.

### dst

[`Tensor`](../../../../type-aliases/Tensor.md)

The pre-allocated destination image tensor to write the mapped
RGBA values to. Expected shape `[H, W, 4]` in HWC layout with data type
`uint8`.

### colormap

\[`number`, `number`, `number`, `number`\][]

An array of RGBA color arrays `[R, G, B, A]` corresponding to
each class index. The size of this list must cover all class indices present
in `src`.

## Returns

[`Tensor`](../../../../type-aliases/Tensor.md)

The destination image tensor with the applied colormap of shape `[H,
W, 4]` and data type `uint8`.

## Throws

With code `INVALID_ARGUMENT` if tensor shapes,
layouts, or data types are invalid, `RESOURCE_BUSY` if a tensor is in use, or
`RESOURCE_DISPOSED` if either tensor was disposed.
