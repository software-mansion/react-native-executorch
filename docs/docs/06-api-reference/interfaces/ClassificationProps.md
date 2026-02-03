# Interface: ClassificationProps

Defined in: [packages/react-native-executorch/src/types/classification.ts:12](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/types/classification.ts#L12)

Props for the `useClassification` hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/classification.ts:13](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/types/classification.ts#L13)

An object containing the model source.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/classification.ts:14](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/types/classification.ts#L14)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
