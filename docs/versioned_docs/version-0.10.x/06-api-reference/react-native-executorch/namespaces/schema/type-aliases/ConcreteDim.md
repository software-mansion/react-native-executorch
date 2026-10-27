# Type Alias: ConcreteDim

> **ConcreteDim** = \{ `kind`: `"constant"`; `value`: `number`; \} \| \{ `kind`: `"range"`; `range`: [`Range`](Range.md); \} \| \{ `choices`: readonly `number`[]; `kind`: `"enum"`; \}

Defined in: [core/schema.ts:91](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L91)

A single dimension with a fully known domain:

- `constant` — exactly `value`.
- `range` — any value of a [Range](Range.md).
- `enum` — one of the listed `choices`.
