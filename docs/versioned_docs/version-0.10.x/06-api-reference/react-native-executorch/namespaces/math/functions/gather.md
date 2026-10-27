# Function: gather()

> **gather**(`src`, `indices`, `dst`, `axis?`): [`Tensor`](../../../../type-aliases/Tensor.md)

Defined in: [extensions/math.ts:104](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/math.ts#L104)

Reads one value per lane out of a float32 source tensor, at the positions
given by an int32 index tensor. Pairs with [argmax](argmax.md), whose output has
exactly the shape this expects, so `argmax` then `gather` yields the maximum
values alongside their indices.

## Parameters

### src

[`Tensor`](../../../../type-aliases/Tensor.md)

The input float32 source tensor. Shape [d1,...,dk,...,dn].

### indices

[`Tensor`](../../../../type-aliases/Tensor.md)

The int32 index tensor, one index per lane. Shape
[d1,...,1,...,dn].

### dst

[`Tensor`](../../../../type-aliases/Tensor.md)

The pre-allocated float32 destination tensor. Same shape as
`indices`.

### axis?

`number` = `-1`

The dimension the indices point into. Defaults to -1 (last
dimension).

## Returns

[`Tensor`](../../../../type-aliases/Tensor.md)

The destination tensor containing the gathered values.

## Throws

With code `INVALID_ARGUMENT` if an index falls
outside the gathered axis.
