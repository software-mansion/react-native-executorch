# Type Alias: ConcreteDim

> **ConcreteDim** = \{ `kind`: `"constant"`; `value`: `number`; \} \| \{ `kind`: `"range"`; `range`: [`Range`](Range.md); \} \| \{ `choices`: readonly `number`[]; `kind`: `"enum"`; \}

Defined in: [core/schema.ts:91](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/schema.ts#L91)

A single dimension with a fully known domain:

- `constant` — exactly `value`.
- `range` — any value of a [Range](Range.md).
- `enum` — one of the listed `choices`.
