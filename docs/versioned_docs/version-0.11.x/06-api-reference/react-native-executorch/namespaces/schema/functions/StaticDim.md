# Function: StaticDim()

> **StaticDim**(`symbol`): [`SymbolicDim`](../type-aliases/SymbolicDim.md)

Defined in: [core/schema.ts:235](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/schema.ts#L235)

Creates a static symbolic dimension. Static symbols bind to constant
dimensions of the exported spec; repeated uses must bind to the same value.

## Parameters

### symbol

`string`

The symbol name.

## Returns

[`SymbolicDim`](../type-aliases/SymbolicDim.md)

The symbolic dimension.
