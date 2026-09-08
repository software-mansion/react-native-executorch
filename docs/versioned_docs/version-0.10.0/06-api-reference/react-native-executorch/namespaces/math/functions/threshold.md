# Function: threshold()

> **threshold**(`src`, `dst`, `thresholdVal`): [`Tensor`](../../../../type-aliases/Tensor.md)

Defined in: [extensions/math.ts:125](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/math.ts#L125)

Applies the element-wise threshold step function on a float32 source tensor and
writes the result to a destination tensor.

## Parameters

### src

[`Tensor`](../../../../type-aliases/Tensor.md)

The input source tensor. Expected shape `[d1, ..., dn]` with data
type `float32`.

### dst

[`Tensor`](../../../../type-aliases/Tensor.md)

The pre-allocated destination tensor to write the result to.
Expected shape `[d1, ..., dn]` matching `src` with data type `float32`.

### thresholdVal

`number`

The threshold value above or equal to which elements are
mapped to 1.0.

## Returns

[`Tensor`](../../../../type-aliases/Tensor.md)

The destination tensor `dst` containing the threshold step output of
shape `[d1, ..., dn]` and data type `float32`.

## Throws

With code `INVALID_ARGUMENT` if tensor shapes or
data types are invalid, `RESOURCE_BUSY` if a tensor is in use, or
`RESOURCE_DISPOSED` if either tensor was disposed.
