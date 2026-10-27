# Function: blendMasked()

> **blendMasked**(`src`, `overlay`, `mask`, `dst`, `options?`): [`Tensor`](../../../../type-aliases/Tensor.md)

Defined in: [extensions/cv/ops/image.ts:306](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L306)

Composites `overlay` over `src` where `mask` is non-zero, writing
`src * (1 - w) + overlay * w` into `dst`, where `w` is the mask eroded and
feathered per `options`. Pixels outside the mask come from `src` unchanged.

## Parameters

### src

[`Tensor`](../../../../type-aliases/Tensor.md)

The base image tensor in HWC layout, `[H, W, C]`, data type `uint8`.

### overlay

[`Tensor`](../../../../type-aliases/Tensor.md)

The image tensor to composite, `[H, W, C]`, data type `uint8`.

### mask

[`Tensor`](../../../../type-aliases/Tensor.md)

The region to take from `overlay`, `[H, W, 1]`, data type `uint8`;
any non-zero value marks a masked pixel.

### dst

[`Tensor`](../../../../type-aliases/Tensor.md)

The pre-allocated destination image tensor, `[H, W, C]`, data type
`uint8`. Must not alias `src` or `overlay`.

### options?

[`BlendMaskedOptions`](../type-aliases/BlendMaskedOptions.md)

Edge erosion and feathering. See [BlendMaskedOptions](../type-aliases/BlendMaskedOptions.md).

## Returns

[`Tensor`](../../../../type-aliases/Tensor.md)

The destination image tensor `dst`.

## Throws

With code `INVALID_ARGUMENT` if tensor shapes,
layouts, or data types are invalid, or `feather` is even, `RESOURCE_BUSY` if
a tensor is in use, or `RESOURCE_DISPOSED` if any tensor was disposed.
