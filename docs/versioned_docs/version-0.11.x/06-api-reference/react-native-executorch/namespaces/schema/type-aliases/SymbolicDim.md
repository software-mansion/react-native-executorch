# Type Alias: SymbolicDim

> **SymbolicDim** = [`ConcreteDim`](ConcreteDim.md) \| \{ `kind`: `"static"`; `symbol`: `string`; \} \| \{ `kind`: `"dynamic"`; `symbol`: `string`; \}

Defined in: [core/schema.ts:104](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/schema.ts#L104)

A single dimension of an allowed model spec. On top of [ConcreteDim](ConcreteDim.md)
domains, a named symbol binds to the exported spec's dimension at
validation: `static` symbols bind to constants, `dynamic` symbols to ranges
or enums. Reusing a symbol requires every occurrence to bind to the same
domain — it does NOT imply any runtime relation between the dimensions.
