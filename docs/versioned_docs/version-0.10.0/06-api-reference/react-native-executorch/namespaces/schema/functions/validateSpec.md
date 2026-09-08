# Function: validateSpec()

> **validateSpec**\<`T`\>(`exportedModelSpec`, `allowedModelSpecs`): [`SpecMatch`](../type-aliases/SpecMatch.md)\<keyof `T`\>

Defined in: [core/schema.ts:944](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L944)

Validates that an exported (concrete) model spec satisfies at least one of
the allowed (symbolic) model specs — variants are tried in order and the
first match wins. For a variant to match:

- Every method exists in the exported spec and its signature matches,
  binding each symbol to a constant value (static) or a range/enum
  (dynamic). Repeated symbols must bind consistently across the whole spec.
- The exported spec declares exactly the same runtime constraints per
  method (1-to-1, no missing, no extras). Constraints are matched as
  declarations only; whether they hold at runtime is the model's guarantee.

Authoring bugs in an allowed spec (conflicting symbol kinds, invalid
constraint coefficients or references) throw immediately, before matching.

## Type Parameters

### T

`T` _extends_ `Record`\<`string`, [`ModelSpec`](../type-aliases/ModelSpec.md)\<[`SymbolicDim`](../type-aliases/SymbolicDim.md)\>\>

## Parameters

### exportedModelSpec

[`ModelSpec`](../type-aliases/ModelSpec.md)\<[`ConcreteDim`](../type-aliases/ConcreteDim.md)\>

The exported model spec to validate against.

### allowedModelSpecs

`T`

The allowed model spec variants keyed by name.

## Returns

[`SpecMatch`](../type-aliases/SpecMatch.md)\<keyof `T`\>

A [SpecMatch](../type-aliases/SpecMatch.md) with the matched variant key and dim
accessors.

## Throws

With code `SCHEMA_MISMATCH`, describing
why every variant failed.
