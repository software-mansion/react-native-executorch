# Interface: ClassificationProps

Defined in: [types/classification.ts:20](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/classification.ts#L20)

Props for the `useClassification` hook.

## Properties

### model

> **model**: `object`

Defined in: [types/classification.ts:21](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/classification.ts#L21)

An object containing the model configuration.

#### modelName

> **modelName**: `"efficientnet-v2-s"`

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/classification.ts:22](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/classification.ts#L22)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
