# Interface: ClassificationProps

Defined in: [packages/react-native-executorch/src/types/classification.ts:11](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/classification.ts#L11)

Props for the `useClassification` hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/classification.ts:12](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/classification.ts#L12)

An object containing the model source.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/classification.ts:13](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/classification.ts#L13)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
