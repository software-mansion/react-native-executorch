# Function: ConstantDim()

> **ConstantDim**(`value`): [`ConcreteDim`](../type-aliases/ConcreteDim.md)

Defined in: [core/schema.ts:258](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L258)

Creates a constant dimension matching exactly `value`.

## Parameters

### value

`number`

The required dimension size.

## Returns

[`ConcreteDim`](../type-aliases/ConcreteDim.md)

The concrete dimension.

## Throws

With code `INVALID_ARGUMENT` if `value`
is not a positive integer.
