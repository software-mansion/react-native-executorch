# Function: EnumDim()

> **EnumDim**(`choices`): [`ConcreteDim`](../type-aliases/ConcreteDim.md)

Defined in: [core/schema.ts:276](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/schema.ts#L276)

Creates an enumerated dimension matching one of `choices`.

## Parameters

### choices

readonly `number`[]

The allowed dimension sizes.

## Returns

[`ConcreteDim`](../type-aliases/ConcreteDim.md)

The concrete dimension.

## Throws

With code `INVALID_ARGUMENT` if any
choice is not a positive integer.
