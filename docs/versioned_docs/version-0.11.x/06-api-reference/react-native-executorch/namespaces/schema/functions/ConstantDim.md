# Function: ConstantDim()

> **ConstantDim**(`value`): [`ConcreteDim`](../type-aliases/ConcreteDim.md)

Defined in: [core/schema.ts:258](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/schema.ts#L258)

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
