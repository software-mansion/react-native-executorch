# Type Alias: SymbolicDim

> **SymbolicDim** = [`ConcreteDim`](ConcreteDim.md) \| \{ `kind`: `"static"`; `symbol`: `string`; \} \| \{ `kind`: `"dynamic"`; `symbol`: `string`; \}

Defined in: [core/schema.ts:104](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L104)

A single dimension of an allowed model spec. On top of [ConcreteDim](ConcreteDim.md)
domains, a named symbol binds to the exported spec's dimension at
validation: `static` symbols bind to constants, `dynamic` symbols to ranges
or enums. Reusing a symbol requires every occurrence to bind to the same
domain — it does NOT imply any runtime relation between the dimensions.
