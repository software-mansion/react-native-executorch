# Function: toChannelsFirst()

> **toChannelsFirst**(`src`, `dst`): [`Tensor`](../../../../type-aliases/Tensor.md)

Defined in: [extensions/cv/ops/image.ts:179](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L179)

Transposes an image tensor layout from HWC (Height, Width, Channel) to CHW
(Channel, Height, Width).

Commonly required for PyTorch Edge models which expect channels-first inputs.

## Parameters

### src

[`Tensor`](../../../../type-aliases/Tensor.md)

The source image tensor in HWC layout. Expected shape `[H, W, C]`
(channels-last). Supports any numeric data type.

### dst

[`Tensor`](../../../../type-aliases/Tensor.md)

The pre-allocated destination image tensor in CHW layout. Expected
shape `[C, H, W]` (channels-first) and the same data type as `src`.

## Returns

[`Tensor`](../../../../type-aliases/Tensor.md)

The destination image tensor in CHW layout of shape `[C, H, W]` and
matching data type.

## Throws

With code `INVALID_ARGUMENT` if tensor shapes,
layouts, or data types are invalid, `RESOURCE_BUSY` if a tensor is in use, or
`RESOURCE_DISPOSED` if either tensor was disposed.
