# Type Alias: DimRef

> **DimRef** = `object`

Defined in: [core/schema.ts:156](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L156)

Reference to a single tensor dimension of a method's input or output.
`tensorIdx` counts only tensor parameters (skipping primitives), consistent
with ExecuTorch's `inputTensorMeta` / `outputTensorMeta` ordering.

## Properties

### dimIdx

> `readonly` **dimIdx**: `number`

Defined in: [core/schema.ts:159](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L159)

---

### paramSide

> `readonly` **paramSide**: `"input"` \| `"output"`

Defined in: [core/schema.ts:157](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L157)

---

### tensorIdx

> `readonly` **tensorIdx**: `number`

Defined in: [core/schema.ts:158](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L158)
