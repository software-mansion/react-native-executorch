# Function: DynamicDim()

> **DynamicDim**(`symbol`): [`SymbolicDim`](../type-aliases/SymbolicDim.md)

Defined in: [core/schema.ts:246](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L246)

Creates a dynamic symbolic dimension. Dynamic symbols bind to range or enum
dimensions of the exported spec; repeated uses must bind to the same domain.

## Parameters

### symbol

`string`

The symbol name.

## Returns

[`SymbolicDim`](../type-aliases/SymbolicDim.md)

The symbolic dimension.
