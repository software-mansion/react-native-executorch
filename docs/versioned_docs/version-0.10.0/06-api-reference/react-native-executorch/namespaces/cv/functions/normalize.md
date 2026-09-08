# Function: normalize()

> **normalize**(`src`, `dst`, `options?`): [`Tensor`](../../../../type-aliases/Tensor.md)

Defined in: [extensions/cv/ops/image.ts:229](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L229)

Normalizes pixel values of an image tensor element-wise.

Computes: `dst[c,h,w] = src[c,h,w] * alpha[c] + beta[c]`. Can normalize
uniformly or channel-wise using array options. The result is cast to `dst`
tensor's dtype.

## Parameters

### src

[`Tensor`](../../../../type-aliases/Tensor.md)

The source image tensor in CHW layout. Expected shape `[C, H, W]`
(channels-first). Supports any numeric data type (typically `uint8` or
`float32`).

### dst

[`Tensor`](../../../../type-aliases/Tensor.md)

The pre-allocated destination image tensor to write normalized
values to. Expected shape `[C, H, W]` matching `src`. The computed values are
cast to `dst` tensor's target data type (typically `float32` or `uint8`).

### options?

[`NormalizeOptions`](../type-aliases/NormalizeOptions.md)

Normalization scaling coefficients. When options or any
individual properties are omitted, defaults to `alpha: 1 / 255.0` and `beta:
0.0`.
See [NormalizeOptions](../type-aliases/NormalizeOptions.md).

## Returns

[`Tensor`](../../../../type-aliases/Tensor.md)

The destination image tensor containing the normalized image of
shape `[C, H, W]` and target data type.

## Throws

With code `INVALID_ARGUMENT` if tensor shapes,
layouts, or data types are invalid, `RESOURCE_BUSY` if a tensor is in use, or
`RESOURCE_DISPOSED` if either tensor was disposed.
