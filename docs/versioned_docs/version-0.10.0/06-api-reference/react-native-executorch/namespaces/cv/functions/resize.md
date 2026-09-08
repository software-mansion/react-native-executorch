# Function: resize()

> **resize**(`src`, `dst`, `options?`): [`Tensor`](../../../../type-aliases/Tensor.md)

Defined in: [extensions/cv/ops/image.ts:131](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L131)

Resizes an image tensor from a source dimension to a destination dimension.

Supports various [ResizeMode](../type-aliases/ResizeMode.md) and [InterpolationMethod](../type-aliases/InterpolationMethod.md) options.

## Parameters

### src

[`Tensor`](../../../../type-aliases/Tensor.md)

The source image tensor in HWC layout. Expected shape `[H, W, C]`
(channels-last). Supports any numeric data type (e.g. `uint8`, `float32`).

### dst

[`Tensor`](../../../../type-aliases/Tensor.md)

The pre-allocated destination image tensor to write the resized
image to. Expected shape `[H', W', C]` in HWC layout (spatial dimensions
`[H', W']`, channel count `C` matching `src`) and the same data type as
`src`.

### options?

[`ResizeOptions`](../type-aliases/ResizeOptions.md)

Configuration options for resizing. When options or any
individual properties are omitted, defaults to `'stretch'` mode, `'lanczos'`
interpolation, and `0` padding.
See [ResizeOptions](../type-aliases/ResizeOptions.md).

## Returns

[`Tensor`](../../../../type-aliases/Tensor.md)

The destination image tensor containing the resized image of shape
`[H', W', C]` and matching data type.

## Throws

With code `INVALID_ARGUMENT` if tensor shapes,
layouts, or data types are invalid, `RESOURCE_BUSY` if a tensor is in use, or
`RESOURCE_DISPOSED` if either tensor was disposed.
