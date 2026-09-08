# Function: argmax()

> **argmax**(`src`, `dst`, `axis?`): [`Tensor`](../../../../type-aliases/Tensor.md)

Defined in: [extensions/math.ts:82](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/math.ts#L82)

Computes the indices of the maximum values along a specified axis on a
float32 source tensor and writes the result to an int32 destination tensor.

## Parameters

### src

[`Tensor`](../../../../type-aliases/Tensor.md)

The input source tensor. Expected shape `[d1, ..., dk, ..., dn]`
with data type `float32`.

### dst

[`Tensor`](../../../../type-aliases/Tensor.md)

The pre-allocated destination tensor to write the indices to.
Expected shape `[d1, ..., 1, ..., dn]` (same rank as `src` with dimension 1
along `axis`) and data type `int32`.

### axis?

`number` = `-1`

The dimension along which argmax is computed. Negative indexing
is supported (e.g. `-1` for the last dimension). Defaults to `-1`.

## Returns

[`Tensor`](../../../../type-aliases/Tensor.md)

The destination tensor `dst` containing the argmax indices of shape
`[d1, ..., 1, ..., dn]` and data type `int32`.

## Throws

With code `INVALID_ARGUMENT` if tensor shapes,
data types, or `axis` are invalid, `RESOURCE_BUSY` if a tensor is in use, or
`RESOURCE_DISPOSED` if either tensor was disposed.
