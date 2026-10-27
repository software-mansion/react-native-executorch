# Function: toChannelsLast()

> **toChannelsLast**(`src`, `dst`): [`Tensor`](../../../../type-aliases/Tensor.md)

Defined in: [extensions/cv/ops/image.ts:201](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L201)

Transposes an image tensor layout from CHW (Channel, Height, Width) to HWC
(Height, Width, Channel).

Useful for post-processing model outputs back into channels-last layouts for
rendering or display.

## Parameters

### src

[`Tensor`](../../../../type-aliases/Tensor.md)

The source image tensor in CHW layout. Expected shape `[C, H, W]`
(channels-first). Supports any numeric data type.

### dst

[`Tensor`](../../../../type-aliases/Tensor.md)

The pre-allocated destination image tensor in HWC layout. Expected
shape `[H, W, C]` (channels-last) and the same data type as `src`.

## Returns

[`Tensor`](../../../../type-aliases/Tensor.md)

The destination image tensor in HWC layout of shape `[H, W, C]` and
matching data type.

## Throws

With code `INVALID_ARGUMENT` if tensor shapes,
layouts, or data types are invalid, `RESOURCE_BUSY` if a tensor is in use, or
`RESOURCE_DISPOSED` if either tensor was disposed.
