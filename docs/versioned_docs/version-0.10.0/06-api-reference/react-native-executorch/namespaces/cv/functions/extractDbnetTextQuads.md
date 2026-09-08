# Function: extractDbnetTextQuads()

> **extractDbnetTextQuads**(`probabilityMap`, `options`): [`Quad`](../type-aliases/Quad.md)[]

Defined in: [extensions/cv/utils/paddleOcrUtils.ts:61](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/utils/paddleOcrUtils.ts#L61)

Decodes a DBNet probability map into oriented text quads: binarizes the map,
traces contours, scores each candidate by its mean probability and unclips the
survivors back to their unshrunk size.

## Parameters

### probabilityMap

[`Tensor`](../../../../type-aliases/Tensor.md)

The `detect` output, shape `[1, 1, H, W]`, post-sigmoid.

### options

[`DbnetDecodeOptions`](../type-aliases/DbnetDecodeOptions.md)

Decode thresholds. See [DbnetDecodeOptions](../type-aliases/DbnetDecodeOptions.md).

## Returns

[`Quad`](../type-aliases/Quad.md)[]

The decoded quads, in detector-input pixel space and arbitrary order.

## Throws

With code `INVALID_ARGUMENT` if tensor shape or
data type is invalid, `RESOURCE_BUSY` if the tensor is in use,
`RESOURCE_DISPOSED` if the tensor was disposed, or `EXECUTION_FAILED` if
native decode returns invalid output.
