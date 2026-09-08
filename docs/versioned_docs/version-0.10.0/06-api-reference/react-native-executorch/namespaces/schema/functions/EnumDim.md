# Function: EnumDim()

> **EnumDim**(`choices`): [`ConcreteDim`](../type-aliases/ConcreteDim.md)

Defined in: [core/schema.ts:276](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L276)

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
