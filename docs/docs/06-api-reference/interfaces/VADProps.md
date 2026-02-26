# Interface: VADProps

Defined in: [types/vad.ts:11](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/vad.ts#L11)

Props for the useVAD hook.

## Properties

### model

> **model**: `object`

Defined in: [types/vad.ts:12](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/vad.ts#L12)

An object containing the model source.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/vad.ts:13](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/vad.ts#L13)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
