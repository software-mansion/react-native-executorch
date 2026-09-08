# Function: cvtColor()

> **cvtColor**(`src`, `dst`, `code`): [`Tensor`](../../../../type-aliases/Tensor.md)

Defined in: [extensions/cv/ops/image.ts:158](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L158)

Converts the color space of an image tensor using a specified color
conversion code.

## Parameters

### src

[`Tensor`](../../../../type-aliases/Tensor.md)

The source image tensor in HWC layout. Expected shape `[H, W, C]`
(channels-last). Supports any numeric data type.

### dst

[`Tensor`](../../../../type-aliases/Tensor.md)

The pre-allocated destination image tensor to write the converted
image to. Expected shape `[H, W, C']` in HWC layout (spatial dimensions `[H,
W]` and data type matching `src`, with target channel count `C'` determined
by `code`).

### code

[`ColorConversionCode`](../type-aliases/ColorConversionCode.md)

The color conversion code indicating source and target spaces.
See [ColorConversionCode](../type-aliases/ColorConversionCode.md).

## Returns

[`Tensor`](../../../../type-aliases/Tensor.md)

The destination image tensor containing the converted image of shape
`[H, W, C']` and matching data type.

## Throws

With code `INVALID_ARGUMENT` if tensor shapes,
layouts, or data types are invalid, `RESOURCE_BUSY` if a tensor is in use, or
`RESOURCE_DISPOSED` if either tensor was disposed.
