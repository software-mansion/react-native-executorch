# Function: DynamicDim()

> **DynamicDim**(`symbol`): [`SymbolicDim`](../type-aliases/SymbolicDim.md)

Defined in: [core/schema.ts:246](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/schema.ts#L246)

Creates a dynamic symbolic dimension. Dynamic symbols bind to range or enum
dimensions of the exported spec; repeated uses must bind to the same domain.

## Parameters

### symbol

`string`

The symbol name.

## Returns

[`SymbolicDim`](../type-aliases/SymbolicDim.md)

The symbolic dimension.
