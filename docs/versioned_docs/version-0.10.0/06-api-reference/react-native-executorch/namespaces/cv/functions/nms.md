# Function: nms()

## Call Signature

> **nms**(`boxes`, `scores`, `options`): `number`[]

Defined in: [extensions/cv/ops/box.ts:178](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/box.ts#L178)

Executes Non-Maximum Suppression (NMS) on bounding boxes and confidence
scores.

### Parameters

#### boxes

[`Tensor`](../../../../type-aliases/Tensor.md)

Bounding boxes coordinate tensor. Expected shape `[N, 4]` and
data type `float32`.

#### scores

[`Tensor`](../../../../type-aliases/Tensor.md)

Bounding boxes confidence scores tensor. Expected shape `[N]`
(1D) and data type `float32`.

#### options

[`NmsOptions`](../type-aliases/NmsOptions.md) & `object`

Options configuring NMS thresholds and execution mode.
See [NmsOptions](../type-aliases/NmsOptions.md).

### Returns

`number`[]

The resulting indices of the non-suppressed boxes:

- For `standard` NMS: A 1D array of indices (`number[]`) representing the
  selected boxes.
- For `weighted` NMS: A 2D array of indices (`number[][]`) representing
  groups of overlapping boxes, where the first element of each group is the
  top candidate and the group indices are used to calculate the weighted
  average of coordinates.

### Throws

With code `INVALID_ARGUMENT` if tensor shapes or
formats are invalid, `RESOURCE_BUSY` if a tensor is in use, or
`RESOURCE_DISPOSED` if either tensor was disposed.

## Call Signature

> **nms**(`boxes`, `scores`, `options`): `number`[][]

Defined in: [extensions/cv/ops/box.ts:183](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/box.ts#L183)

Executes Non-Maximum Suppression (NMS) on bounding boxes and confidence
scores.

### Parameters

#### boxes

[`Tensor`](../../../../type-aliases/Tensor.md)

Bounding boxes coordinate tensor. Expected shape `[N, 4]` and
data type `float32`.

#### scores

[`Tensor`](../../../../type-aliases/Tensor.md)

Bounding boxes confidence scores tensor. Expected shape `[N]`
(1D) and data type `float32`.

#### options

[`NmsOptions`](../type-aliases/NmsOptions.md) & `object`

Options configuring NMS thresholds and execution mode.
See [NmsOptions](../type-aliases/NmsOptions.md).

### Returns

`number`[][]

The resulting indices of the non-suppressed boxes:

- For `standard` NMS: A 1D array of indices (`number[]`) representing the
  selected boxes.
- For `weighted` NMS: A 2D array of indices (`number[][]`) representing
  groups of overlapping boxes, where the first element of each group is the
  top candidate and the group indices are used to calculate the weighted
  average of coordinates.

### Throws

With code `INVALID_ARGUMENT` if tensor shapes or
formats are invalid, `RESOURCE_BUSY` if a tensor is in use, or
`RESOURCE_DISPOSED` if either tensor was disposed.
