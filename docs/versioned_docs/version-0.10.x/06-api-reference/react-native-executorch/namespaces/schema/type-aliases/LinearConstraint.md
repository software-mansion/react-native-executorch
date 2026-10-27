# Type Alias: LinearConstraint

> **LinearConstraint** = `object`

Defined in: [core/schema.ts:178](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L178)

Runtime constraint declaring that two dimensions must satisfy
`dimLhs = coefficients[0] * dimRhs + coefficients[1]` (integer
coefficients) in any given execution of the method.

## Properties

### coefficients

> `readonly` **coefficients**: \[`number`, `number`\]

Defined in: [core/schema.ts:182](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L182)

---

### dimLhs

> `readonly` **dimLhs**: [`DimRef`](DimRef.md)

Defined in: [core/schema.ts:180](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L180)

---

### dimRhs

> `readonly` **dimRhs**: [`DimRef`](DimRef.md)

Defined in: [core/schema.ts:181](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L181)

---

### kind

> `readonly` **kind**: `"linear"`

Defined in: [core/schema.ts:179](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L179)
